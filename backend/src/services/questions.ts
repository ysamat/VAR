import { openai, MODEL } from "../config/openai";
import {
  WeightedReview,
  PropertyInsights,
  InformationGap,
  GeneratedQuestions,
  SentimentTopic,
} from "../types";
import { analyzeSentiment } from "./sentiment";
import { detectAndTranslate } from "./translation";

/**
 * Identify what information is missing or underrepresented
 * in the existing reviews for a property.
 */
export async function identifyGaps(
  insights: PropertyInsights,
  weightedReviews: WeightedReview[]
): Promise<InformationGap[]> {
  const reviewTexts = weightedReviews
    .filter((r) => r.review_body)
    .map((r) => `[weight=${r.weight.toFixed(3)}] ${r.review_body}`)
    .join("\n---\n");

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You identify what useful information is MISSING from a set of hotel reviews.
Think about what a traveler would want to know when booking: wifi quality, noise levels,
bathroom condition, parking, nearby restaurants, check-in/check-out experience, pet policy,
accessibility, heating/AC quality, room size, view, etc.

Return JSON:
{
  "gaps": [
    {"category": "<topic>", "description": "<what specific info is missing>", "priority": <0-1>}
  ]
}
Return 3-6 gaps, sorted by priority descending. Only flag genuinely missing info, not topics already well-covered.`,
      },
      {
        role: "user",
        content: `CURRENT INSIGHTS:\nPros: ${insights.pros.join(", ")}\nCons: ${insights.cons.join(", ")}\nDetails: ${insights.details.join(", ")}\n\nREVIEWS:\n${reviewTexts}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);
  return parsed.gaps as InformationGap[];
}

/**
 * Collect all sentiment topics from reviews for use in verification questions.
 * Translates non-English reviews first.
 */
async function collectSentimentTopics(
  weightedReviews: WeightedReview[]
): Promise<(SentimentTopic & { weight: number })[]> {
  const allTopics: (SentimentTopic & { weight: number })[] = [];

  // Analyze top weighted reviews (limit to 20 for API cost)
  const sorted = [...weightedReviews]
    .filter((r) => r.review_body)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20);

  const analyses = await Promise.all(
    sorted.map(async (r) => {
      const translated = await detectAndTranslate(r.review_body!);
      const sentiment = await analyzeSentiment(translated.translated_text);
      return { sentiment, weight: r.weight };
    })
  );

  for (const { sentiment, weight } of analyses) {
    for (const topic of sentiment.topics) {
      allTopics.push({ ...topic, weight });
    }
  }

  return allTopics;
}

/**
 * Generate two questions for a guest who just stayed at the property:
 *
 * 1. Gap question — asks about missing information
 * 2. Verification question — asks to confirm/deny a previous positive or negative topic
 *    (50/50 random split between positive and negative)
 */
export async function generateQuestions(
  insights: PropertyInsights,
  weightedReviews: WeightedReview[]
): Promise<GeneratedQuestions> {
  // Identify gaps and sentiment topics in parallel
  const [gaps, sentimentTopics] = await Promise.all([
    identifyGaps(insights, weightedReviews),
    collectSentimentTopics(weightedReviews),
  ]);

  // Pick top gap
  const topGap = gaps[0] ?? {
    category: "overall experience",
    description: "general impressions of the stay",
    priority: 0.5,
  };

  // 50/50 split: pick a positive or negative topic for verification
  const verifyPositive = Math.random() < 0.5;
  const targetSentiment = verifyPositive ? "positive" : "negative";

  // Filter topics by target sentiment, prefer higher-weight (recent) reviews
  const candidateTopics = sentimentTopics
    .filter((t) => t.sentiment === targetSentiment)
    .sort((a, b) => b.weight * b.severity - a.weight * a.severity);

  // Fallback: if no topics of the target type, flip
  const fallbackTopics =
    candidateTopics.length > 0
      ? candidateTopics
      : sentimentTopics
          .filter((t) => t.sentiment !== "neutral")
          .sort((a, b) => b.weight * b.severity - a.weight * a.severity);

  const verifyTopic = fallbackTopics[0];

  // Generate both questions via a single LLM call
  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You generate exactly 2 conversational, friendly questions for a hotel guest who just completed their stay.

Question 1 (gap question): Ask about something we DON'T yet know from existing reviews.
Question 2 (verification question): Ask whether a specific aspect mentioned in a previous review still holds true.

Rules:
- Keep questions natural and concise (1 sentence each)
- Don't mention "reviews" or "other guests" — frame as genuine curiosity
- Don't ask yes/no questions — encourage descriptive answers
- For the verification question, subtly reference the topic without quoting the original review

Return JSON:
{
  "gap_question": "<question text>",
  "verification_question": "<question text>"
}`,
      },
      {
        role: "user",
        content: `GAP TO ASK ABOUT:\nCategory: ${topGap.category}\nMissing info: ${topGap.description}\n\nTOPIC TO VERIFY:\n${
          verifyTopic
            ? `Topic: ${verifyTopic.topic}\nPrevious sentiment: ${verifyTopic.sentiment}\nExcerpt: "${verifyTopic.excerpt}"`
            : "No specific topic available — ask about their overall experience highlight or lowlight."
        }`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);

  return {
    gap_question: {
      question: parsed.gap_question,
      target_gap: topGap.category,
    },
    verification_question: {
      question: parsed.verification_question,
      type: verifyTopic?.sentiment === "positive" ? "positive" : "negative",
      source_topic: verifyTopic?.topic ?? "overall experience",
      source_excerpt: verifyTopic?.excerpt ?? "",
    },
  };
}
