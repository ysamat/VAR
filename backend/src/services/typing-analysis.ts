import { openai, MODEL } from "../config/openai";
import { TypingAnalysis } from "../types";

/**
 * Analyze partial review text while the user is typing.
 * Determines if the answer is substantial enough and suggests
 * specific expansions if it's too short or vague.
 *
 * Designed to be called on debounce (~1-2s after last keystroke)
 * from the frontend.
 */
export async function analyzeTyping(
  partialText: string,
  question: string,
  questionType: "gap" | "verification"
): Promise<TypingAnalysis> {
  const trimmed = partialText.trim();

  // Don't analyze until user has typed a few words
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
}

Examples of good suggestions:
- "Could you describe what the wifi speed was like?"
- "What specifically about the room stood out?"
- "How did that compare to what you expected?"`,
      },
      {
        role: "user",
        content: `Question asked: "${question}"\nQuestion type: ${questionType}\nUser's answer so far: "${trimmed}"`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!) as TypingAnalysis;
}
