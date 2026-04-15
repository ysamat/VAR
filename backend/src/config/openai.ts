import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// gpt-4o-mini: best ROI for all tasks in this pipeline —
// sentiment, translation, insights, question generation, review synthesis.
// Cheap enough to call frequently, smart enough for nuanced text analysis.
export const MODEL = "gpt-4o-mini";
