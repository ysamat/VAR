import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// gpt-4o-mini: best ROI — cheap enough for frequent calls,
// smart enough for sentiment, translation, insights, and question generation.
export const MODEL = "gpt-4o-mini";
