import { openai, MODEL } from "./openai";

interface TranslationResult {
  original_language: string;
  translated_text: string;
  was_translated: boolean;
}

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
