import { openai, MODEL } from "./openai";
import {
  PropertyInsights,
  PropertiesAggregated,
  WeightedReview,
  RatingCategory,
  RATING_CATEGORIES,
} from "./types";
import { detectAndTranslate } from "./translation";
import type { PropertyDescription } from "./database";

function buildReviewContext(reviews: WeightedReview[]): string {
  const sorted = [...reviews].sort((a, b) => b.weight - a.weight);
  return sorted
    .map((r) => {
      const title = r.review_title ? `Title: ${r.review_title}\n` : "";
      const body = r.review_body ?? "(no text)";
      return `[weight=${r.weight.toFixed(3)}, date=${r.acquisition_date}]\n${title}${body}`;
    })
    .join("\n---\n");
}

function buildRatingsContext(aggregated: PropertiesAggregated): string {
  const lines: string[] = [];
  for (const cat of RATING_CATEGORIES) {
    const field = aggregated[cat];
    if (field && field.count > 0) {
      lines.push(`${cat}: avg=${field.avg?.toFixed(2) ?? "N/A"}, count=${field.count}`);
    }
  }
  return lines.join("\n");
}

function buildDescriptionContext(desc: PropertyDescription | null): string {
  if (!desc) return "";
  const lines: string[] = [];
  if (desc.city || desc.country) {
    lines.push(`Location: ${[desc.city, desc.province, desc.country].filter(Boolean).join(", ")}`);
  }
  if (desc.star_rating) lines.push(`Star rating: ${desc.star_rating}`);
  if (desc.guestrating_avg_expedia) lines.push(`Expedia guest rating: ${desc.guestrating_avg_expedia}/10`);
  if (desc.property_description) {
    lines.push(`Description: ${desc.property_description.replace(/<[^>]*>/g, " ").slice(0, 400)}`);
  }
  if (desc.area_description) {
    lines.push(`Area: ${desc.area_description.slice(0, 300)}`);
  }
  if (desc.popular_amenities_list?.length) {
    lines.push(`Amenities: ${desc.popular_amenities_list.join(", ")}`);
  }
  if (desc.check_in_start_time) lines.push(`Check-in: ${desc.check_in_start_time} – ${desc.check_in_end_time ?? "N/A"}`);
  if (desc.check_out_time) lines.push(`Check-out: ${desc.check_out_time}`);
  if (desc.pet_policy?.length) lines.push(`Pet policy: ${desc.pet_policy.join("; ")}`);
  return lines.join("\n");
}

export async function generateInsights(
  aggregated: PropertiesAggregated,
  weightedReviews: WeightedReview[],
  description?: PropertyDescription | null
): Promise<PropertyInsights> {
  // Translate non-English reviews
  const translatedReviews = await Promise.all(
    weightedReviews.map(async (r) => {
      if (!r.review_body) return r;
      const translation = await detectAndTranslate(r.review_body);
      return {
        ...r,
        review_body: translation.translated_text,
        review_title: r.review_title
          ? (await detectAndTranslate(r.review_title)).translated_text
          : r.review_title,
      };
    })
  );

  const reviewContext = buildReviewContext(translatedReviews);
  const ratingsContext = buildRatingsContext(aggregated);
  const descContext = buildDescriptionContext(description ?? null);

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You analyze hotel/property reviews to produce actionable insights for travelers.
Reviews have a [weight] tag — higher weight means the review is more recent and more relevant.
Prioritize recent (high-weight) reviews over older ones when there are conflicting opinions.
You also receive official property metadata (description, amenities, location, policies) to enrich your analysis.

Return JSON:
{
  "pros": ["<specific positive aspects, max 8>"],
  "cons": ["<specific negative aspects, max 8>"],
  "details": ["<useful booking info: location tips, noise level, amenity specifics, transport access, check-in/out times, pet policy, etc., max 8>"],
  "summary": "<2-3 sentence overview of the property from a traveler's perspective>"
}

Be specific. "Good breakfast" is weak; "Hot buffet breakfast with local dishes and fresh juice" is strong.
Only include items with sufficient evidence. Use property metadata for factual details (amenities, policies, location).`,
      },
      {
        role: "user",
        content: `PROPERTY METADATA:\n${descContext || "Not available"}\n\nAGGREGATED RATINGS:\n${ratingsContext}\n\nREVIEWS (${translatedReviews.length} total):\n${reviewContext}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);

  const ratingSnapshot: Record<string, any> = {};
  for (const cat of RATING_CATEGORIES) {
    ratingSnapshot[cat] = aggregated[cat];
  }

  return {
    eg_property_id: aggregated.eg_property_id,
    pros: parsed.pros,
    cons: parsed.cons,
    details: parsed.details,
    summary: parsed.summary,
    rating_snapshot: ratingSnapshot as Record<RatingCategory, any>,
    generated_at: new Date().toISOString(),
  };
}
