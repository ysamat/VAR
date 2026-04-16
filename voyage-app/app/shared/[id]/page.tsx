import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchSharedTrip } from "@/lib/backend/sharedTrips";
import { TripSummaryCard } from "@/components/TripSummaryCard";

// Shared trip pages are immutable once created. Cache for a day; a
// revalidation is cheap since content never changes.
export const revalidate = 86400;

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const trip = await fetchSharedTrip(id);
    if (!trip) return { title: "Trip not found — VAR" };
    const title = trip.tripLabel ?? trip.itinerary.city.name;
    return {
      title: `${title} — VAR Recap`,
      description: `A shared trip recap from VAR — ${trip.itinerary.stops.length} stops in ${trip.itinerary.city.name}.`,
    };
  } catch {
    return { title: "VAR — Shared Trip Recap" };
  }
}

export default async function SharedTripPage({ params }: PageProps) {
  const { id } = await params;
  const trip = await fetchSharedTrip(id);
  if (!trip) notFound();

  return (
    <main className="min-h-screen bg-brand-dark">
      <TripSummaryCard
        tripLabel={trip.tripLabel}
        tripConfig={trip.tripConfig}
        itinerary={trip.itinerary}
        answersByStopId={trip.answersByStopId}
        synthesizedByStop={trip.synthesizedByStop}
        shared
      />
    </main>
  );
}
