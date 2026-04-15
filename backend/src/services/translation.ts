import { openai, MODEL } from "../config/openai";

interface TranslationResult {
  original_language: string;
  translated_text: string;
  was_translated: boolean;
}

/**
 * Detect the language of a text and translate to English if needed.
 * Uses a single OpenAI call to do both detection and translation.
 */
export async function detectAndTranslate(text: string): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return { original_language: "unknown", translated_text: text, was_translated: false };
  }

  const response = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You detect the language of text and translate it to English if it is not already English.
Return JSON: {"language": "<ISO 639-1 code>", "is_english": <boolean>, "translated": "<English text or original if already English>"}`,
      },
      { role: "user", content: text },
    ],
  });

  const result = JSON.parse(response.choices[0].message.content!);
  return {
    original_language: result.language,
    translated_text: result.translated,
    was_translated: !result.is_english,
  };
}

/**
 * Batch-translate an array of review texts. Passes through nulls unchanged.
 */
export async function translateReviews(
  texts: (string | null)[]
): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];
  // Process in parallel batches of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const promises = batch.map((t) =>
      t ? detectAndTranslate(t) : Promise.resolve({ original_language: "unknown", translated_text: "", was_translated: false })
    );
    results.push(...(await Promise.all(promises)));
  }
  return results;
}
