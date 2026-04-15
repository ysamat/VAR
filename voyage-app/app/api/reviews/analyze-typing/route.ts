import { NextRequest, NextResponse } from "next/server";
import { analyzeTyping } from "@/lib/backend/typing-analysis";

export async function POST(req: NextRequest) {
  try {
    const { partial_text, question, question_type } = await req.json();

    if (!partial_text || !question) {
      return NextResponse.json(
        { error: "partial_text and question are required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeTyping(
      partial_text,
      question,
      question_type ?? "gap"
    );

    return NextResponse.json(analysis);
  } catch (err: any) {
    console.error("Error analyzing typing:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
