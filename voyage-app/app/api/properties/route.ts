import { NextResponse } from "next/server";
import { getAllProperties } from "@/lib/backend/database";
import { getPropertyLocation } from "@/lib/propertyLocations";
import {
  buildPropertySummary,
  getOfflinePropertySummaries,
} from "@/lib/propertySummary";

/**
 * GET /api/properties
 *
 * Returns every property in Supabase, enriched with lat/lng + arrival airport
 * from the in-code lookup. Properties with no location entry are dropped —
 * we only surface destinations we can actually animate.
 *
 * When Supabase is unreachable or returns no joinable rows, falls back to the
 * static offline list (still with real city/country labels).
 */
export async function GET() {
  try {
    let rows: Awaited<ReturnType<typeof getAllProperties>> = [];
    let dbError: string | undefined;

    try {
      rows = await getAllProperties();
    } catch (err: any) {
      dbError = err.message ?? "Supabase unavailable";
      console.error("Error listing properties from Supabase:", err);
    }

    const properties = rows
      .map((r) => {
        const loc = getPropertyLocation(r.eg_property_id);
        if (!loc) return null;
        return buildPropertySummary(loc, r);
      })
      .filter((p): p is NonNullable<typeof p> => p != null);

    if (properties.length > 0) {
      return NextResponse.json({ properties });
    }

    const offline = getOfflinePropertySummaries();
    return NextResponse.json({
      properties: offline,
      offline: true,
      ...(dbError ? { warning: dbError } : { warning: "No matching properties in database" }),
    });
  } catch (err: any) {
    console.error("Error listing properties:", err);
    return NextResponse.json({
      properties: getOfflinePropertySummaries(),
      offline: true,
      warning: err.message ?? "Failed to load properties",
    });
  }
}
