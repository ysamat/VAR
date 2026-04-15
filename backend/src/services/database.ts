import { supabase } from "../config/supabase";
import {
  PropertiesAggregated,
  PropertyReview,
  RatingCategory,
  RatingField,
  RATING_CATEGORIES,
  SynthesizedReview,
} from "../types";

/**
 * Fetch the aggregated ratings row for a property.
 */
export async function getAggregated(
  propertyId: string
): Promise<PropertiesAggregated | null> {
  const { data, error } = await supabase
    .from("properties_aggregated")
    .select("*")
    .eq("eg_property_id", propertyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw new Error(`Supabase error (aggregated): ${error.message}`);
  }
  return data as PropertiesAggregated;
}

/**
 * Fetch all reviews for a property, ordered by date descending.
 */
export async function getReviews(propertyId: string): Promise<PropertyReview[]> {
  const { data, error } = await supabase
    .from("property_reviews")
    .select("*")
    .eq("eg_property_id", propertyId)
    .order("acquisition_date", { ascending: false });

  if (error) throw new Error(`Supabase error (reviews): ${error.message}`);
  return (data ?? []) as PropertyReview[];
}

/**
 * Insert a new review into property_reviews.
 */
export async function insertReview(
  propertyId: string,
  title: string,
  body: string
): Promise<PropertyReview> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from("property_reviews")
    .insert({
      eg_property_id: propertyId,
      acquisition_date: today,
      review_title: title,
      review_body: body,
    })
    .select()
    .single();

  if (error) throw new Error(`Supabase insert error: ${error.message}`);
  return data as PropertyReview;
}

/**
 * Update the properties_aggregated row to incorporate a new review's
 * inferred numerical ratings.
 *
 * For each category in inferred_ratings:
 *   new_avg = (old_avg * old_count + new_value) / (old_count + 1)
 *   new_count = old_count + 1
 *
 * Also appends today's date to review_dates.
 */
export async function updateAggregated(
  propertyId: string,
  inferredRatings: Partial<Record<RatingCategory, number>>
): Promise<void> {
  // Fetch current aggregated data
  const current = await getAggregated(propertyId);
  if (!current) {
    throw new Error(`Property ${propertyId} not found in properties_aggregated`);
  }

  const updates: Record<string, any> = {};
  const today = new Date().toISOString().split("T")[0];

  // Update each rating category that has an inferred value
  for (const cat of RATING_CATEGORIES) {
    if (inferredRatings[cat] != null) {
      const oldField: RatingField = current[cat] ?? { avg: null, count: 0 };
      const oldAvg = oldField.avg ?? 0;
      const oldCount = oldField.count ?? 0;
      const newCount = oldCount + 1;
      const newAvg = (oldAvg * oldCount + inferredRatings[cat]!) / newCount;

      updates[cat] = {
        avg: Math.round(newAvg * 100) / 100,
        count: newCount,
      };
    }
  }

  // Always update overall count if we're adding a review
  if (!updates.overall) {
    const oldOverall: RatingField = current.overall ?? { avg: null, count: 0 };
    updates.overall = {
      avg: oldOverall.avg,
      count: (oldOverall.count ?? 0) + 1,
    };
  }

  // Append today to review_dates
  const existingDates: string[] = current.review_dates ?? [];
  updates.review_dates = [...existingDates, today];

  const { error } = await supabase
    .from("properties_aggregated")
    .update(updates)
    .eq("eg_property_id", propertyId);

  if (error) throw new Error(`Supabase update error: ${error.message}`);
}
