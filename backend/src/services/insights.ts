import { openai, MODEL } from "../config/openai";
import {
  PropertyInsights,
  PropertiesAggregated,
  WeightedReview,
  RatingCategory,
  RATING_CATEGORIES,
} from "../types";
import { detectAndTranslate } from "./translation";

/**
 * Build a weighted text block from reviews for the LLM prompt.
 * Higher-weight reviews appear with a [weight] tag so the model
 * understands their relative importance.
 */
function buildReviewContext(reviews: WeightedReview[]): string {
  // Sort by weight descending so most relevant reviews come first
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

/**
 * Generate property insights (pros, cons, details, summary) from
 * half-life-weighted reviews and aggregated ratings.
 */
export async function generateInsights(
  aggregated: PropertiesAggregated,
  weightedReviews: WeightedReview[]
): Promise<PropertyInsights> {
  // Translate non-English reviews first
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

Return JSON:
{
  "pros": ["<specific positive aspects, max 8>"],
  "cons": ["<specific negative aspects, max 8>"],
  "details": ["<useful booking info: location tips, noise level, amenity specifics, transport access, etc., max 8>"],
  "summary": "<2-3 sentence overview of the property from a traveler's perspective>"
}

Be specific. "Good breakfast" is weak; "Hot buffet breakfast with local dishes and fresh juice" is strong.
Only include items with sufficient evidence. If only one low-weight review mentions something, skip it.`,
      },
      {
        role: "user",
        content: `AGGREGATED RATINGS:\n${ratingsContext}\n\nREVIEWS (${translatedReviews.length} total):\n${reviewContext}`,
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
