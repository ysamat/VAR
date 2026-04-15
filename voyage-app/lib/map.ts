/** Dark Mapbox style — swap for another style URL to change map look. */
export const MAP_STYLE_URL = "mapbox://styles/mapbox/dark-v11";

/** Default framing for a destination city — tune zoom, pitch, bearing. */
export function cityInitialView(city: { lat: number; lng: number }) {
  return {
    center: [city.lng, city.lat] as [number, number],
    zoom: 12.5,
    pitch: 55,
    bearing: -20,
  };
}

/** `map.flyTo` between itinerary stops — adjust duration (ms) for pacing. */
export const FLY_TO_STOP = {
  zoom: 14.2,
  pitch: 54,
  bearing: -18,
  durationMs: 2000,
} as const;

/** GeoJSON route line — line width and opacity for the itinerary path. */
export const ROUTE_LINE_LAYOUT = {
  lineColor: "#FBCC33",
  lineWidth: 4,
  lineOpacity: 0.9,
} as const;

/** Softer underlay for a subtle glow (added below the main line). */
export const ROUTE_GLOW_LAYOUT = {
  lineColor: "#FBCC33",
  lineWidth: 12,
  lineOpacity: 0.22,
  lineBlur: 1.5,
} as const;

/** Stop circles: inactive vs active emphasis. */
export const STOP_CIRCLE_STYLES = {
  inactive: { radius: 5, color: "#64748b", opacity: 0.55 },
  active: { radius: 11, color: "#FBCC33", opacity: 1 },
} as const;

export function buildRouteLineString(stops: { lng: number; lat: number }[]) {
  return {
    type: "Feature" as const,
    properties: {} as Record<string, never>,
    geometry: {
      type: "LineString" as const,
      coordinates: stops.map((s) => [s.lng, s.lat]),
    },
  };
}

export function buildStopsFeatureCollection(
  stops: { id: string; name: string; lng: number; lat: number }[],
  activeStopId: string | null,
) {
  return {
    type: "FeatureCollection" as const,
    features: stops.map((stop) => ({
      type: "Feature" as const,
      id: stop.id,
      properties: {
        id: stop.id,
        name: stop.name,
        isActive: stop.id === activeStopId,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [stop.lng, stop.lat] as [number, number],
      },
    })),
  };
}
