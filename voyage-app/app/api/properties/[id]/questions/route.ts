import { NextRequest, NextResponse } from "next/server";
import {
  getAggregated,
  getReviews,
  getDescription,
  insertReview,
} from "@/lib/backend/database";
import { weightReviews } from "@/lib/backend/halflife";
import { generateInsights } from "@/lib/backend/insights";
import { generateQuestions } from "@/lib/backend/questions";
import { recordReviewQualityEvent } from "@/lib/backend/review-analytics-store";
import type { GeneratedQuestions, PropertyReview } from "@/lib/backend/types";

const COSTA_RICA_DEMO_PROPERTY_ID =
  "3b984f3ba8df55b2609a1e33fd694cf8407842e1d833c9b4d993b07fc83a2820";
const COSTA_RICA_SEED_REVIEW_TITLE = "[DEMO_SEED_COSTA_RICA] Random baseline review";

const COSTA_RICA_DEMO_QUESTIONS: GeneratedQuestions = {
  gap_question: {
    question:
      "How was the room noise level overnight, and what made it easy or hard to rest well?",
    target_gap: "sleep quality and overnight noise",
  },
  verification_question: {
    question:
      "How would you describe the bathroom quality during your stay, including cleanliness and condition?",
    type: "positive",
    source_topic: "bathroom quality",
    source_excerpt: "Bathroom quality has mixed mentions in recent feedback.",
  },
  debug: {
    missing_info_areas: [
      {
        category: "sleep quality and overnight noise",
        description: "specific overnight noise sources and rest quality details",
        priority: 0.92,
      },
      {
        category: "bathroom quality",
        description: "cleanliness, fixtures, and overall bathroom condition during the stay",
        priority: 0.84,
      },
    ],
    selected_gap: {
      category: "sleep quality and overnight noise",
      description: "specific overnight noise sources and rest quality details",
      priority: 0.92,
    },
    selected_verification_topic: {
      topic: "bathroom quality",
      sentiment: "positive",
      severity: 0.5,
      weight: 0.5,
      score: 0.25,
      excerpt: "Bathroom quality has mixed mentions in recent feedback.",
    },
  },
};

function isCostaRicaDemoProperty(propertyId: string): boolean {
  return propertyId === COSTA_RICA_DEMO_PROPERTY_ID;
}

async function ensureCostaRicaSeedReviewExists(
  propertyId: string,
  reviews: PropertyReview[]
): Promise<void> {
  const alreadySeeded = reviews.some((r) => r.review_title === COSTA_RICA_SEED_REVIEW_TITLE);
  if (alreadySeeded) return;

  // Intentionally random/neutral text so it is harmless for demo analytics.
  const seeded = await insertReview(
    propertyId,
    COSTA_RICA_SEED_REVIEW_TITLE,
    "Purple suitcase, 7:12 a.m. pineapple soda, hallway song, cloud looked like a turtle, and then coffee."
  );

  // Also seed one dashboard analytics event so the premade review is visible there.
  recordReviewQualityEvent({
    propertyId,
    gapQuestion: COSTA_RICA_DEMO_QUESTIONS.gap_question.question,
    verificationQuestion: COSTA_RICA_DEMO_QUESTIONS.verification_question.question,
    verificationType: COSTA_RICA_DEMO_QUESTIONS.verification_question.type,
    targetGap: COSTA_RICA_DEMO_QUESTIONS.gap_question.target_gap,
    gapPriority: COSTA_RICA_DEMO_QUESTIONS.debug?.selected_gap.priority,
    gapDescription: COSTA_RICA_DEMO_QUESTIONS.debug?.selected_gap.description,
    missingInfoAreas: COSTA_RICA_DEMO_QUESTIONS.debug?.missing_info_areas,
    verificationTopic: COSTA_RICA_DEMO_QUESTIONS.verification_question.source_topic,
    verificationExcerpt: COSTA_RICA_DEMO_QUESTIONS.verification_question.source_excerpt,
    verificationWeight: COSTA_RICA_DEMO_QUESTIONS.debug?.selected_verification_topic?.weight,
    verificationSeverity: COSTA_RICA_DEMO_QUESTIONS.debug?.selected_verification_topic?.severity,
    verificationScore: COSTA_RICA_DEMO_QUESTIONS.debug?.selected_verification_topic?.score,
    gapAnswer: "Misc notes: orange socks, humming fan, postcard, 11:03, and a small blue umbrella.",
    verificationAnswer: "Hard to say for sure yet.",
    reviewTitle: seeded.review_title ?? COSTA_RICA_SEED_REVIEW_TITLE,
    reviewBody:
      seeded.review_body ??
      "Purple suitcase, 7:12 a.m. pineapple soda, hallway song, cloud looked like a turtle, and then coffee.",
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;

    const [aggregated, reviews, description] = await Promise.all([
      getAggregated(propertyId),
      getReviews(propertyId),
      getDescription(propertyId),
    ]);

    if (!aggregated) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (isCostaRicaDemoProperty(propertyId)) {
      await ensureCostaRicaSeedReviewExists(propertyId, reviews);
      return NextResponse.json(COSTA_RICA_DEMO_QUESTIONS);
    }

    const weighted = weightReviews(reviews);
    const insights = await generateInsights(aggregated, weighted, description);
    const questions = await generateQuestions(insights, weighted);

    return NextResponse.json(questions);
  } catch (err: any) {
    console.error("Error generating questions:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
