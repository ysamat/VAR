import { NextResponse } from "next/server";
import { getAllProperties } from "@/lib/backend/database";
import { getPropertyLocation } from "@/lib/propertyLocations";

/**
 * GET /api/properties
 *
 * Returns every property in Supabase, enriched with lat/lng + arrival airport
 * from the in-code lookup. Properties with no location entry are dropped —
 * we only surface destinations we can actually animate.
 */
export async function GET() {
  try {
    const rows = await getAllProperties();

    const properties = rows
      .map((r) => {
        const loc = getPropertyLocation(r.eg_property_id);
        if (!loc) return null;
        return {
          eg_property_id: r.eg_property_id,
          city: r.city,
          province: r.province,
          country: r.country,
          star_rating: r.star_rating,
          guestrating_avg_expedia: r.guestrating_avg_expedia,
          lat: loc.lat,
          lng: loc.lng,
          airport: loc.airport,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ properties });
  } catch (err: any) {
    console.error("Error listing properties:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
