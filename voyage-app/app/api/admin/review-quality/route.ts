import { NextRequest, NextResponse } from "next/server";
import { getReviewQualitySummary } from "@/lib/backend/review-analytics-store";

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get("limit");
  const parsedLimit = Number(limitParam);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 25;

  return NextResponse.json(getReviewQualitySummary(Math.min(limit, 100)));
}
