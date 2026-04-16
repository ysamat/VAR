import { openai, MODEL } from "./openai";
import {
  RATING_CATEGORIES,
  RatingCategory,
  SentimentResult,
} from "./types";

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  if (!text || text.trim().length === 0) {
    return { sentiment: "neutral", severity: 0, topics: [] };
  }

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a sentiment analysis engine for hotel/property reviews.
Analyze the review and return JSON with this exact structure:
{
  "sentiment": "positive" | "negative" | "neutral",
  "severity": <float 0-1, how strongly positive or negative>,
  "topics": [
    {
      "topic": "<specific aspect, e.g. pool, breakfast, staff, room size>",
      "sentiment": "positive" | "negative" | "neutral",
      "severity": <float 0-1>,
      "excerpt": "<relevant quote from the review>"
    }
  ]
}
Extract as many distinct topics as are mentioned. Be precise with excerpts.`,
      },
      { role: "user", content: text },
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as SentimentResult;
}

/**
 * Derive numerical 1-10 ratings per RATING_CATEGORY from a guest's free-text
 * answers using sentiment analysis. Only categories the text actually
 * touches on are returned — no neutral filler. The "overall" score, if
 * not directly stated, is computed as the mean of the other categories.
 */
export async function deriveRatingsFromText(
  text: string
): Promise<Partial<Record<RatingCategory, number>>> {
  if (!text || text.trim().length === 0) return {};

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You convert hotel-review text into per-category numerical ratings using sentiment analysis.

For each rating category that the review text *actually discusses* (explicitly or strongly implicitly), output an integer 1-10:
  10 = excellent / glowing positive sentiment
   7 = good / mildly positive
   5 = neutral or mixed
   3 = poor / mildly negative
   1 = terrible / strongly negative

Do NOT invent ratings for categories the text does not address. Skip them.

Allowed categories (use these exact keys):
${RATING_CATEGORIES.join(", ")}

Category guidance:
- roomcleanliness: cleanliness of the room/bathroom
- service: staff helpfulness, friendliness, responsiveness
- roomcomfort: bed, pillows, temperature, quietness
- hotelcondition: building age, maintenance, wear
- roomquality: overall room quality, decor, finish
- convenienceoflocation: proximity to transport, attractions
- neighborhoodsatisfaction: safety, vibe, area appeal
- valueformoney: price relative to what was received
- roomamenitiesscore: in-room amenities (minibar, TV, etc.)
- communication: pre-arrival/booking communication
- ecofriendliness: sustainability practices
- checkin: check-in/check-out experience
- onlinelisting: accuracy of photos/description vs reality
- location: general location quality
- overall: overall stay rating

Return JSON:
{
  "ratings": { "<category>": <1-10>, ... }
}`,
      },
      { role: "user", content: text },
    ],
  });

  let parsed: { ratings?: Record<string, number> } = {};
  try {
    parsed = JSON.parse(response.choices[0].message.content!);
  } catch {
    return {};
  }

  const result: Partial<Record<RatingCategory, number>> = {};
  if (parsed.ratings) {
    for (const [key, val] of Object.entries(parsed.ratings)) {
      if (
        RATING_CATEGORIES.includes(key as RatingCategory) &&
        typeof val === "number" &&
        Number.isFinite(val)
      ) {
        result[key as RatingCategory] = Math.max(1, Math.min(10, Math.round(val)));
      }
    }
  }

  // If overall wasn't explicitly rated but we have other ratings, derive it
  // as the mean — gives the aggregates table a reasonable overall update.
  if (result.overall == null) {
    const others = Object.entries(result).filter(([k]) => k !== "overall");
    if (others.length > 0) {
      const mean =
        others.reduce((sum, [, v]) => sum + (v as number), 0) / others.length;
      result.overall = Math.max(1, Math.min(10, Math.round(mean)));
    }
  }

  return result;
}
