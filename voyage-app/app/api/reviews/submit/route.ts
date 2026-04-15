import { NextRequest, NextResponse } from "next/server";
import { synthesizeReview } from "@/lib/backend/review-synthesis";
import { insertReview, updateAggregated } from "@/lib/backend/database";

export async function POST(req: NextRequest) {
  try {
    const {
      eg_property_id,
      gap_answer,
      verification_answer,
      gap_question,
      verification_question,
      verification_type,
    } = await req.json();

    if (!eg_property_id || !gap_answer || !verification_answer) {
      return NextResponse.json(
        { error: "eg_property_id, gap_answer, and verification_answer are required" },
        { status: 400 }
      );
    }

    // 1. Synthesize answers into a comprehensive review + inferred ratings
    const synthesized = await synthesizeReview(
      gap_question,
      gap_answer,
      verification_question,
      verification_answer,
      verification_type ?? "negative"
    );

    // 2. Insert the review into property_reviews
    const newReview = await insertReview(
      eg_property_id,
      synthesized.review_title,
      synthesized.review_body
    );

    // 3. Update properties_aggregated with inferred numerical ratings
    await updateAggregated(eg_property_id, synthesized.inferred_ratings);

    return NextResponse.json({
      review: newReview,
      synthesized,
      message: "Review submitted and aggregates updated. The cycle continues.",
    });
  } catch (err: any) {
    console.error("Error submitting review:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
