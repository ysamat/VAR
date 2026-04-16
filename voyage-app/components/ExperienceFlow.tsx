"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { DestinationMapExperience, type StopAnswerData } from "@/components/DestinationMapExperience";
import { GlobeExperience } from "@/components/GlobeExperience";
import { TripSetupPanel } from "@/components/TripSetupPanel";
import { TripSummaryCard } from "@/components/TripSummaryCard";
import { GLOBE_TO_MAP_CROSSFADE_MS } from "@/lib/animation";
import { DEFAULT_DEMO_TRIP_CONFIG } from "@/lib/presets";
import { tripConfigToGlobeTrip, tripConfigToItinerary } from "@/lib/tripAdapters";
import type { TripConfig } from "@/lib/tripSchema";
import type { ExperiencePhase } from "@/lib/experience";

/** Map of stopId → AI-generated review (title + body + ratings) returned from /api/reviews/submit. */
type SynthesizedByStop = Record<
  string,
  { review_title: string; review_body: string } | undefined
>;

/**
 * Submit AI-powered reviews to the backend.
 * Collects the synthesized title+body for each submitted stop so the summary
 * card can display the AI-generated headline the user effectively authored.
 */
async function submitAIReviews(
  answersByStopId: Record<string, StopAnswerData>
): Promise<SynthesizedByStop> {
  // Submit any stop with a property id and at least one non-empty answer.
  // `meta` is guaranteed to be set by DestinationMapExperience (falls back
  // to static questions when AI questions did not load).
  const submissions = Object.entries(answersByStopId).filter(
    ([, d]) =>
      d.eg_property_id &&
      d.meta &&
      d.answers.length >= 2 &&
      d.answers.some((a) => a.trim().length > 0)
  );

  if (submissions.length === 0) {
    console.warn(
      "[submitAIReviews] No stops eligible for submission",
      Object.entries(answersByStopId).map(([id, d]) => ({
        id,
        hasPropertyId: !!d.eg_property_id,
        hasMeta: !!d.meta,
        answerCount: d.answers.length,
      }))
    );
  }

  const results: SynthesizedByStop = {};

  await Promise.allSettled(
    submissions.map(async ([stopId, d]) => {
      try {
        const res = await fetch("/api/reviews/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eg_property_id: d.eg_property_id,
            gap_answer: d.answers[0],
            verification_answer: d.answers[1],
            gap_question: d.meta!.gap_question,
            verification_question: d.meta!.verification_question,
            verification_type: d.meta!.verification_type,
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(
            `[submitAIReviews] ${stopId} failed: HTTP ${res.status}`,
            body
          );
          return;
        }
        const json = await res.json();
        if (json?.synthesized?.review_title) {
          results[stopId] = {
            review_title: json.synthesized.review_title,
            review_body: json.synthesized.review_body,
          };
        }
      } catch (err) {
        console.error(`[submitAIReviews] ${stopId} threw`, err);
      }
    })
  );

  return results;
}

export function ExperienceFlow() {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [phase, setPhase] = useState<ExperiencePhase>("setup");
  const [tripConfig, setTripConfig] = useState<TripConfig>(() =>
    structuredClone(DEFAULT_DEMO_TRIP_CONFIG),
  );
  const [tripLabel, setTripLabel] = useState<string | undefined>(undefined);
  const [sessionKey, setSessionKey] = useState(0);
  const [summaryAnswers, setSummaryAnswers] = useState<Record<string, string[]> | null>(null);
  const [submittingReviews, setSubmittingReviews] = useState(false);
  const [synthesized, setSynthesized] = useState<SynthesizedByStop>({});

  const itinerary = useMemo(() => tripConfigToItinerary(tripConfig), [tripConfig]);
  const globeTrip = useMemo(() => tripConfigToGlobeTrip(tripConfig), [tripConfig]);

  // Auto-advance through crossfade phases.
  useEffect(() => {
    if (phase === "transition-to-map") {
      const t = window.setTimeout(() => setPhase("map-review"), GLOBE_TO_MAP_CROSSFADE_MS);
      return () => window.clearTimeout(t);
    }
    if (phase === "transition-to-globe") {
      const t = window.setTimeout(() => setPhase("globe-return"), GLOBE_TO_MAP_CROSSFADE_MS);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  const startExperience = (config: TripConfig, label?: string) => {
    setTripConfig(config);
    setTripLabel(label);
    setSummaryAnswers(null);
    setSynthesized({});
    setSessionKey((k) => k + 1);
    setPhase("globe-outbound");
  };

  const handleArrivalContinue = () => {
    setPhase("transition-to-map");
  };

  const handleItineraryComplete = (richAnswers: Record<string, StopAnswerData>) => {
    const simpleAnswers: Record<string, string[]> = {};
    for (const [stopId, data] of Object.entries(richAnswers)) {
      simpleAnswers[stopId] = data.answers;
    }
    setSummaryAnswers(simpleAnswers);

    // Kick off backend review submission in parallel with the return flight.
    setSubmittingReviews(true);
    submitAIReviews(richAnswers)
      .then((res) => setSynthesized(res))
      .finally(() => setSubmittingReviews(false));

    // Start the return animation — crossfade back to globe, then fly home.
    setPhase("transition-to-globe");
  };

  const handleReturnComplete = () => {
    setPhase("summary");
  };

  const handleReplay = () => {
    setSummaryAnswers(null);
    setSynthesized({});
    setSessionKey((k) => k + 1);
    setPhase("globe-outbound");
  };

  const handleBackToSetup = () => {
    setSummaryAnswers(null);
    setSynthesized({});
    setPhase("setup");
  };

  const handleResetToDemo = () => {
    setTripConfig(structuredClone(DEFAULT_DEMO_TRIP_CONFIG));
    setTripLabel(undefined);
    setSummaryAnswers(null);
    setSynthesized({});
    setSessionKey((k) => k + 1);
    setPhase("setup");
  };

  const transitionLabel =
    phase === "transition-to-globe"
      ? `Heading home to ${tripConfig.flight.origin.name}`
      : `Entering ${tripConfig.flight.destination.name}`;

  const scrollablePhases = phase === "setup" || phase === "summary";

  const globeVisible =
    phase === "globe-outbound" ||
    phase === "transition-to-map" ||
    phase === "transition-to-globe" ||
    phase === "globe-return";

  const mapVisible =
    phase === "transition-to-map" ||
    phase === "map-review" ||
    phase === "transition-to-globe";

  const globeOpacity =
    phase === "globe-outbound" || phase === "globe-return" ? 1
    : phase === "transition-to-globe" ? 1
    : 0;

  const mapOpacity =
    phase === "map-review" ? 1
    : phase === "transition-to-map" ? 1
    : phase === "transition-to-globe" ? 0
    : 0;

  const globeMode: "outbound" | "return" =
    phase === "globe-return" ? "return" : "outbound";

  return (
    <div
      className={
        scrollablePhases
          ? "relative min-h-screen w-full"
          : "relative h-screen w-full overflow-hidden"
      }
    >
      {phase === "setup" && (
        <TripSetupPanel seedConfig={tripConfig} onStart={startExperience} />
      )}

      {globeVisible && (
        <motion.div
          className="absolute inset-0 z-10"
          animate={{ opacity: globeOpacity }}
          transition={{ duration: GLOBE_TO_MAP_CROSSFADE_MS / 1000, ease: "easeInOut" }}
          style={{
            pointerEvents:
              phase === "globe-outbound" || phase === "globe-return" ? "auto" : "none",
          }}
        >
          <GlobeExperience
            key={`globe-${sessionKey}-${globeMode}`}
            trip={globeTrip}
            mode={globeMode}
            onArrivalContinue={handleArrivalContinue}
            onReturnComplete={handleReturnComplete}
          />
        </motion.div>
      )}

      {mapVisible && (
        <motion.div
          key={`map-${sessionKey}`}
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: mapOpacity }}
          transition={{ duration: GLOBE_TO_MAP_CROSSFADE_MS / 1000, ease: "easeInOut" }}
        >
          <DestinationMapExperience
            itinerary={itinerary}
            mapboxToken={mapboxToken}
            showReviewUI={phase === "map-review"}
            onItineraryComplete={handleItineraryComplete}
          />
        </motion.div>
      )}

      {(phase === "transition-to-map" || phase === "transition-to-globe") && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-[15] -translate-x-1/2 rounded-full border border-brand-yellow/20 bg-brand-dark-card/60 px-5 py-2 text-xs uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-md">
          {transitionLabel}
        </div>
      )}

      {phase === "summary" && summaryAnswers && (
        <>
          <TripSummaryCard
            tripLabel={tripLabel}
            tripConfig={tripConfig}
            itinerary={itinerary}
            answersByStopId={summaryAnswers}
            synthesizedByStop={synthesized}
            onReplay={handleReplay}
            onBackToSetup={handleBackToSetup}
            onResetToDemo={handleResetToDemo}
          />
          {submittingReviews && (
            <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-brand-yellow/30 bg-brand-dark-card/90 px-4 py-2 text-xs text-brand-yellow backdrop-blur-sm">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-brand-yellow border-t-transparent" />
              Saving reviews to database...
            </div>
          )}
        </>
      )}
    </div>
  );
}
