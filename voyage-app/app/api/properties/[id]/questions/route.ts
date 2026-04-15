import { NextRequest, NextResponse } from "next/server";
import { getAggregated, getReviews, getDescription } from "@/lib/backend/database";
import { weightReviews } from "@/lib/backend/halflife";
import { generateInsights } from "@/lib/backend/insights";
import { generateQuestions } from "@/lib/backend/questions";

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

    const weighted = weightReviews(reviews);
    const insights = await generateInsights(aggregated, weighted, description);
    const questions = await generateQuestions(insights, weighted);

    return NextResponse.json(questions);
  } catch (err: any) {
    console.error("Error generating questions:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
