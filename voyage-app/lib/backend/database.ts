import { supabase } from "./supabase";
import {
  PropertiesAggregated,
  PropertyReview,
  RatingCategory,
  RatingField,
  RATING_CATEGORIES,
} from "./types";

// ── Description table (property metadata, amenities, policies) ──

export interface PropertyDescription {
  eg_property_id: string;
  guestrating_avg_expedia: number | null;
  city: string | null;
  province: string | null;
  country: string | null;
  star_rating: number | null;
  area_description: string | null;
  property_description: string | null;
  popular_amenities_list: string[] | null;
  check_in_start_time: string | null;
  check_in_end_time: string | null;
  check_out_time: string | null;
  check_out_policy: string[] | null;
  pet_policy: string[] | null;
  children_and_extra_bed_policy: string[] | null;
  check_in_instructions: string[] | null;
  know_before_you_go: string | string[] | null;
  [key: string]: any; // amenity sub-categories
}

/**
 * List every property in the `description` table — used by the home screen
 * to populate the destination dropdown. Returns city/country/rating so the
 * UI can render something recognizable without paying per-row cost.
 */
export async function getAllProperties(): Promise<
  Array<{
    eg_property_id: string;
    city: string | null;
    province: string | null;
    country: string | null;
    star_rating: number | null;
    guestrating_avg_expedia: number | null;
  }>
> {
  const { data, error } = await supabase
    .from("description")
    .select(
      "eg_property_id, city, province, country, star_rating, guestrating_avg_expedia"
    )
    .order("country", { ascending: true });

  if (error) throw new Error(`Supabase error (list properties): ${error.message}`);
  return (data ?? []) as any;
}

export async function getDescription(
  propertyId: string
): Promise<PropertyDescription | null> {
  const { data, error } = await supabase
    .from("description")
    .select("*")
    .eq("eg_property_id", propertyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Supabase error (description): ${error.message}`);
  }
  return data as PropertyDescription;
}

export async function getAggregated(
  propertyId: string
): Promise<PropertiesAggregated | null> {
  const { data, error } = await supabase
    .from("properties_aggregated")
    .select("*")
    .eq("eg_property_id", propertyId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Supabase error (aggregated): ${error.message}`);
  }
  return data as PropertiesAggregated;
}

export async function getReviews(propertyId: string): Promise<PropertyReview[]> {
  const { data, error } = await supabase
    .from("property_reviews")
    .select("*")
    .eq("eg_property_id", propertyId)
    .order("acquisition_date", { ascending: false });

  if (error) throw new Error(`Supabase error (reviews): ${error.message}`);
  return (data ?? []) as PropertyReview[];
}

export async function insertReview(
  propertyId: string,
  title: string,
  body: string
): Promise<PropertyReview> {
  const today = new Date().toISOString().split("T")[0];

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

export async function updateAggregated(
  propertyId: string,
  inferredRatings: Partial<Record<RatingCategory, number>>
): Promise<void> {
  const current = await getAggregated(propertyId);
  if (!current) {
    throw new Error(`Property ${propertyId} not found in properties_aggregated`);
  }

  const updates: Record<string, any> = {};
  const today = new Date().toISOString().split("T")[0];

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

  if (!updates.overall) {
    const oldOverall: RatingField = current.overall ?? { avg: null, count: 0 };
    updates.overall = {
      avg: oldOverall.avg,
      count: (oldOverall.count ?? 0) + 1,
    };
  }

  const existingDates: string[] = current.review_dates ?? [];
  updates.review_dates = [...existingDates, today];

  const { error } = await supabase
    .from("properties_aggregated")
    .update(updates)
    .eq("eg_property_id", propertyId);

  if (error) throw new Error(`Supabase update error: ${error.message}`);
}
