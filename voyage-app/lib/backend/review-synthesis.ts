import { openai, MODEL } from "./openai";
import { SynthesizedReview, RATING_CATEGORIES, RatingCategory } from "./types";

export async function synthesizeReview(
  gapQuestion: string,
  gapAnswer: string,
  verificationQuestion: string,
  verificationAnswer: string,
  verificationType: "positive" | "negative"
): Promise<SynthesizedReview> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You synthesize a guest's answers into a polished, comprehensive hotel review.

You receive two Q&A pairs from the guest. Combine them into:
1. A concise review title (max 10 words)
2. A review body (2-4 sentences) that reads naturally as a single coherent review.
   Write in first person. Don't reference the questions — make it flow as if the guest wrote it freely.
3. Inferred numerical ratings on a 1-10 scale for any categories you can reasonably judge from the text.
   Only include categories where the text provides clear signal. Possible categories:
   ${RATING_CATEGORIES.join(", ")}

Return JSON:
{
  "review_title": "<title>",
  "review_body": "<body>",
  "inferred_ratings": {"<category>": <1-10>, ...}
}`,
      },
      {
        role: "user",
        content: `Q1 (filling information gap): "${gapQuestion}"
A1: "${gapAnswer}"

Q2 (verifying a ${verificationType} aspect): "${verificationQuestion}"
A2: "${verificationAnswer}"`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0].message.content!);

  const validRatings: Partial<Record<RatingCategory, number>> = {};
  if (parsed.inferred_ratings) {
    for (const [key, val] of Object.entries(parsed.inferred_ratings)) {
      if (RATING_CATEGORIES.includes(key as RatingCategory) && typeof val === "number") {
        validRatings[key as RatingCategory] = Math.max(1, Math.min(10, Math.round(val as number)));
      }
    }
  }

  return {
    review_title: parsed.review_title,
    review_body: parsed.review_body,
    inferred_ratings: validRatings,
  };
}
