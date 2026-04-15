import { tripConfigSchema, type TripConfig } from "@/lib/tripSchema";
import {
  ORIGIN_AIRPORT,
  PROPERTY_LOCATIONS,
  type Airport,
} from "@/lib/propertyLocations";

/**
 * A property summary the UI (dropdown) and the trip builder both consume.
 * Mirrors the shape of /api/properties rows — so the same type works for
 * either the server fetch result or the static fallback.
 */
export type PropertySummary = {
  eg_property_id: string;
  city: string | null;
  province: string | null;
  country: string | null;
  star_rating: number | null;
  guestrating_avg_expedia: number | null;
  lat: number;
  lng: number;
  airport: Airport;
};

/**
 * Build a TripConfig for a single property:
 *   origin = JFK (fixed)
 *   destination = property's nearest airport (from lookup)
 *   stops = [the property itself]
 *
 * Questions are intentionally generic — the real questions come from the
 * AI endpoint at /api/properties/:id/questions when the review card renders.
 */
export function buildTripFromProperty(property: PropertySummary): TripConfig {
  const locationLabel = [property.city, property.country].filter(Boolean).join(", ");
  const stopId = `stop-${property.eg_property_id.slice(0, 10)}`;

  return tripConfigSchema.parse({
    flight: {
      origin: {
        name: ORIGIN_AIRPORT.name,
        lat: ORIGIN_AIRPORT.lat,
        lng: ORIGIN_AIRPORT.lng,
      },
      destination: {
        name: `${property.airport.name} (${property.airport.iata})`,
        lat: property.airport.lat,
        lng: property.airport.lng,
      },
    },
    stops: [
      {
        id: stopId,
        name: locationLabel || "Property",
        lat: property.lat,
        lng: property.lng,
        type: "hotel",
        questions: [
          `What was your overall impression of this property in ${property.city ?? "the area"}?`,
          "What stood out — good or bad — about your stay?",
        ],
        eg_property_id: property.eg_property_id,
      },
    ],
  });
}

/**
 * Static fallback list — used when /api/properties fails (e.g. offline) so
 * the setup panel still renders something. Built from the in-code lookup.
 */
export const FALLBACK_PROPERTIES: PropertySummary[] = Object.values(
  PROPERTY_LOCATIONS
).map((loc) => ({
  eg_property_id: loc.eg_property_id,
  city: null,
  province: null,
  country: null,
  star_rating: null,
  guestrating_avg_expedia: null,
  lat: loc.lat,
  lng: loc.lng,
  airport: loc.airport,
}));

/** A safe default trip — first fallback property. Used until real data loads. */
export const DEFAULT_DEMO_TRIP_CONFIG: TripConfig = buildTripFromProperty(
  FALLBACK_PROPERTIES[0]
);
