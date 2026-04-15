import type { Itinerary } from "@/lib/itineraryData";
import type { TripConfig } from "@/lib/tripSchema";
import type { Trip } from "@/lib/tripData";

export function tripConfigToGlobeTrip(config: TripConfig): Trip {
  const first = config.stops[0];
  return {
    flight: config.flight,
    stop: {
      id: `${first.id}-teaser`,
      name: first.name,
      lat: first.lat,
      lng: first.lng,
      type: first.type,
      questions: [],
    },
  };
}

export function tripConfigToItinerary(config: TripConfig): Itinerary {
  return {
    city: {
      name: config.flight.destination.name,
      lat: config.flight.destination.lat,
      lng: config.flight.destination.lng,
    },
    stops: config.stops.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      type: s.type,
      questions: s.questions,
      camera: s.camera,
      eg_property_id: s.eg_property_id,
    })),
  };
}
