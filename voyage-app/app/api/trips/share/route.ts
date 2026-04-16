import { NextRequest, NextResponse } from "next/server";
import { createSharedTrip } from "@/lib/backend/sharedTrips";

// Sanity cap — a typical recap payload is ~5-15 KB. This stops someone
// from POSTing megabytes of JSON.
const MAX_PAYLOAD_BYTES = 150_000;

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();
    if (bodyText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    const body = JSON.parse(bodyText);
    const { tripLabel, tripConfig, itinerary, answersByStopId, synthesizedByStop } = body;

    if (!tripConfig || !itinerary) {
      return NextResponse.json(
        { error: "tripConfig and itinerary are required" },
        { status: 400 }
      );
    }

    const id = await createSharedTrip({
      tripLabel,
      tripConfig,
      itinerary,
      answersByStopId: answersByStopId ?? {},
      synthesizedByStop: synthesizedByStop ?? {},
    });

    return NextResponse.json({ id, path: `/shared/${id}` });
  } catch (err: any) {
    console.error("[/api/trips/share] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
