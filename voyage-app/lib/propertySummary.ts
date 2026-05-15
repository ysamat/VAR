import type { PropertySummary } from "@/lib/presets";
import {
  PROPERTY_LOCATIONS,
  type PropertyLocation,
} from "@/lib/propertyLocations";

type DbPropertyFields = {
  city?: string | null;
  province?: string | null;
  country?: string | null;
  star_rating?: number | null;
  guestrating_avg_expedia?: number | null;
};

/** Merge Supabase description fields with in-code location labels (DB wins when set). */
export function buildPropertySummary(
  loc: PropertyLocation,
  db?: DbPropertyFields | null
): PropertySummary {
  return {
    eg_property_id: loc.eg_property_id,
    city: db?.city ?? loc.city,
    province: db?.province ?? loc.province ?? null,
    country: db?.country ?? loc.country,
    star_rating: db?.star_rating ?? null,
    guestrating_avg_expedia: db?.guestrating_avg_expedia ?? null,
    lat: loc.lat,
    lng: loc.lng,
    airport: loc.airport,
  };
}

/** All known destinations with static labels — used when Supabase is unavailable. */
export function getOfflinePropertySummaries(): PropertySummary[] {
  return Object.values(PROPERTY_LOCATIONS).map((loc) => buildPropertySummary(loc));
}
