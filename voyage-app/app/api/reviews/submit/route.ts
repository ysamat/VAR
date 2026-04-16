import { NextRequest, NextResponse } from "next/server";
import { synthesizeReview } from "@/lib/backend/review-synthesis";
import { deriveRatingsFromText } from "@/lib/backend/sentiment";
import { insertReview, updateAggregated } from "@/lib/backend/database";
import { recordReviewQualityEvent } from "@/lib/backend/review-analytics-store";
import type { RatingCategory } from "@/lib/backend/types";

export async function POST(req: NextRequest) {
  try {
    const {
      eg_property_id,
      gap_answer,
      verification_answer,
      gap_question,
      verification_question,
      verification_type,
      target_gap,
      gap_priority,
      gap_description,
      missing_info_areas,
      verification_topic,
      verification_excerpt,
      verification_weight,
      verification_severity,
      verification_score,
    } = await req.json();

    if (!eg_property_id || !gap_answer || !verification_answer) {
      return NextResponse.json(
        { error: "eg_property_id, gap_answer, and verification_answer are required" },
        { status: 400 }
      );
    }

    // Combined raw answer text for sentiment analysis. Includes the question
    // context so the model can interpret short answers like "yes" correctly.
    const rawAnswerText = [
      gap_question ? `Q: ${gap_question}\nA: ${gap_answer}` : gap_answer,
      verification_question
        ? `Q: ${verification_question}\nA: ${verification_answer}`
        : verification_answer,
    ]
      .filter(Boolean)
      .join("\n\n");

    // 1. Run synthesis (title + body + GPT-inferred ratings) and sentiment-
    //    based rating derivation in parallel.
    const [synthesized, sentimentRatings] = await Promise.all([
      synthesizeReview(
        gap_question,
        gap_answer,
        verification_question,
        verification_answer,
        verification_type ?? "negative"
      ),
      deriveRatingsFromText(rawAnswerText),
    ]);

    // 2. Merge ratings: sentiment-derived wins on conflict (it's the more
    //    rigorous signal, calibrated specifically for category mapping).
    //    Synthesis-inferred ratings fill in anything sentiment missed.
    const mergedRatings: Partial<Record<RatingCategory, number>> = {
      ...synthesized.inferred_ratings,
      ...sentimentRatings,
    };

    // 3. Insert the review into property_reviews
    const newReview = await insertReview(
      eg_property_id,
      synthesized.review_title,
      synthesized.review_body
    );

    // 4. Update properties_aggregated with the merged numerical ratings
    await updateAggregated(eg_property_id, mergedRatings);

    // 5. Save demo analytics so admin can show quality uplift in real-time.
    recordReviewQualityEvent({
      propertyId: eg_property_id,
      gapAnswer: gap_answer,
      verificationAnswer: verification_answer,
      gapQuestion: gap_question,
      verificationQuestion: verification_question,
      verificationType: verification_type,
      targetGap: target_gap,
      gapPriority: gap_priority,
      gapDescription: gap_description,
      missingInfoAreas: missing_info_areas,
      verificationTopic: verification_topic,
      verificationExcerpt: verification_excerpt,
      verificationWeight: verification_weight,
      verificationSeverity: verification_severity,
      verificationScore: verification_score,
      reviewTitle: synthesized.review_title,
      reviewBody: synthesized.review_body,
    });

    return NextResponse.json({
      review: newReview,
      synthesized: {
        ...synthesized,
        inferred_ratings: mergedRatings,
      },
      sentiment_ratings: sentimentRatings,
      message: "Review submitted and aggregates updated.",
    });
  } catch (err: any) {
    console.error("[/api/reviews/submit] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
