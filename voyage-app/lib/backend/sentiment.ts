import { openai, MODEL } from "./openai";
import { SentimentResult } from "./types";

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
