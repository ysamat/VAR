export type ItineraryStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  questions: string[];
  camera?: {
    zoom?: number;
    pitch?: number;
    bearing?: number;
    durationMs?: number;
  };
  /** Optional Supabase property ID — enables AI-powered review questions */
  eg_property_id?: string;
};

export type Itinerary = {
  city: {
    name: string;
    lat: number;
    lng: number;
  };
  stops: ItineraryStop[];
};
