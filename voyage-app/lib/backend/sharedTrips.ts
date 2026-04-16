import { supabase } from "./supabase";
import type { TripConfig } from "@/lib/tripSchema";
import type { Itinerary } from "@/lib/itineraryData";

export type SynthesizedEntry = {
  review_title: string;
  review_body: string;
};

/**
 * Everything needed to rehydrate a `TripSummaryCard` on the shared-link
 * page. We persist the whole tripConfig + itinerary so the shared view
 * doesn't depend on whether the original source data still exists.
 */
export type SharedTripData = {
  tripLabel?: string;
  tripConfig: TripConfig;
  itinerary: Itinerary;
  answersByStopId: Record<string, string[]>;
  synthesizedByStop: Record<string, SynthesizedEntry | undefined>;
};

export async function createSharedTrip(data: SharedTripData): Promise<string> {
  const { data: inserted, error } = await supabase
    .from("shared_trips")
    .insert({
      trip_label: data.tripLabel ?? null,
      trip_config: data.tripConfig,
      itinerary: data.itinerary,
      answers_by_stop_id: data.answersByStopId,
      synthesized_by_stop: data.synthesizedByStop,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create shared trip: ${error.message}`);
  }
  return inserted.id as string;
}

export async function fetchSharedTrip(id: string): Promise<SharedTripData | null> {
  const { data, error } = await supabase
    .from("shared_trips")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch shared trip: ${error.message}`);
  }
  if (!data) return null;

  return {
    tripLabel: data.trip_label ?? undefined,
    tripConfig: data.trip_config as TripConfig,
    itinerary: data.itinerary as Itinerary,
    answersByStopId: (data.answers_by_stop_id ?? {}) as Record<string, string[]>,
    synthesizedByStop: (data.synthesized_by_stop ?? {}) as Record<
      string,
      SynthesizedEntry | undefined
    >,
  };
}
