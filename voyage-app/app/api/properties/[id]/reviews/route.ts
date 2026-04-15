import { NextRequest, NextResponse } from "next/server";
import { getReviews } from "@/lib/backend/database";
import { weightReviews } from "@/lib/backend/halflife";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;
    const reviews = await getReviews(propertyId);
    const weighted = weightReviews(reviews);
    return NextResponse.json(weighted);
  } catch (err: any) {
    console.error("Error fetching reviews:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
