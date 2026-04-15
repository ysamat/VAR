import { openai, MODEL } from "./openai";
import { TypingAnalysis } from "./types";

export async function analyzeTyping(
  partialText: string,
  question: string,
  questionType: "gap" | "verification"
): Promise<TypingAnalysis> {
  const trimmed = partialText.trim();

  if (trimmed.split(/\s+/).length < 3) {
    return { sufficient: false, suggestion: null };
  }

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You evaluate whether a guest's partial answer to a hotel review question is informative enough.

An answer is SUFFICIENT if it:
- Provides specific, descriptive information (not just "good" or "bad")
- Addresses the question being asked
- Contains enough detail that another traveler would find it useful

If insufficient, provide a SHORT, friendly nudge (max 15 words) asking them to expand on a specific point they already mentioned, or to add more detail.

Return JSON:
{
  "sufficient": <boolean>,
  "suggestion": "<null if sufficient, otherwise a brief prompt>"
}`,
      },
      {
        role: "user",
        content: `Question asked: "${question}"\nQuestion type: ${questionType}\nUser's answer so far: "${trimmed}"`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as TypingAnalysis;
}
