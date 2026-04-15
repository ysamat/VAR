import { openai, MODEL } from "../config/openai";
import { SentimentResult } from "../types";

/**
 * Analyze the sentiment of a review text.
 * Returns overall sentiment, severity, and per-topic breakdowns.
 */
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
 * Batch-analyze sentiment for multiple review texts.
 */
export async function batchAnalyzeSentiment(
  texts: string[]
): Promise<SentimentResult[]> {
  const BATCH_SIZE = 10;
  const results: SentimentResult[] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const promises = batch.map((t) => analyzeSentiment(t));
    results.push(...(await Promise.all(promises)));
  }
  return results;
}
