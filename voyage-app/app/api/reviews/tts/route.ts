import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/backend/openai";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text.slice(0, 1200),
      response_format: "mp3",
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("[/api/reviews/tts] error:", err);
    return NextResponse.json({ error: err.message ?? "TTS failed" }, { status: 500 });
  }
}
