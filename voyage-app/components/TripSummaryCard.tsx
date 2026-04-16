"use client";

import { motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { RecapHighlightsPanel } from "@/components/RecapHighlightsPanel";
import { VarLogo } from "@/components/VarLogo";
import type { Itinerary } from "@/lib/itineraryData";
import { buildLocalRecap } from "@/lib/recap";
import type { TripConfig } from "@/lib/tripSchema";

type SynthesizedEntry = { review_title: string; review_body: string };

type TripSummaryCardProps = {
  tripLabel?: string;
  tripConfig: TripConfig;
  itinerary: Itinerary;
  answersByStopId: Record<string, string[]>;
  /** AI-generated review title + body per stop id (once /api/reviews/submit returns). */
  synthesizedByStop?: Record<string, SynthesizedEntry | undefined>;
  onReplay: () => void;
  onBackToSetup: () => void;
  onResetToDemo: () => void;
};

/** Build a shareable text recap */
function buildShareText(
  tripLabel: string | undefined,
  itinerary: Itinerary,
  recapText: string,
  stopNames: string[]
): string {
  const title = tripLabel ?? itinerary.city.name;
  const stops = stopNames.join(" → ");
  return `${title}\n${stops}\n\n${recapText}\n\nRecapped with VAR`;
}

export function TripSummaryCard({
  tripLabel,
  tripConfig,
  itinerary,
  answersByStopId,
  synthesizedByStop,
  onReplay,
  onBackToSetup,
  onResetToDemo,
}: TripSummaryCardProps) {
  const recap = useMemo(
    () => buildLocalRecap(tripConfig, answersByStopId),
    [tripConfig, answersByStopId],
  );
  const [expandedStopIds, setExpandedStopIds] = useState<Set<string>>(new Set());
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  const toggleStop = (stopId: string) => {
    setExpandedStopIds((prev) => {
      const next = new Set(prev);
      if (next.has(stopId)) next.delete(stopId);
      else next.add(stopId);
      return next;
    });
  };

  const shareText = useMemo(
    () => buildShareText(tripLabel, itinerary, recap.recapText, recap.visitedStopNames),
    [tripLabel, itinerary, recap],
  );

  const showFeedback = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // ── Share actions ──

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      showFeedback("Copied to clipboard!");
    } catch {
      showFeedback("Failed to copy");
    }
    setShareMenuOpen(false);
  };

  const shareViaText = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`sms:?body=${encoded}`, "_blank");
    setShareMenuOpen(false);
  };

  const shareToInstagram = useCallback(async () => {
    // Generate a story-ready image from the recap card using canvas
    const card = storyRef.current;
    if (!card) return;

    // Use the Web Share API if available (mobile), otherwise copy text
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VAR — ${tripLabel ?? itinerary.city.name}`,
          text: shareText,
        });
      } catch {
        // User cancelled or API not supported
      }
    } else {
      // Desktop fallback: copy the share text for manual paste into Instagram
      try {
        await navigator.clipboard.writeText(shareText);
        showFeedback("Copied! Paste into your Instagram story");
      } catch {
        showFeedback("Failed to copy");
      }
    }
    setShareMenuOpen(false);
  }, [shareText, tripLabel, itinerary.city.name]);

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VAR — ${tripLabel ?? itinerary.city.name}`,
          text: shareText,
        });
      } catch {
        // User cancelled
      }
    } else {
      await copyToClipboard();
    }
    setShareMenuOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-brand-dark/92 p-5 pb-12 pt-6 backdrop-blur-md"
    >
      <div
        ref={storyRef}
        className="w-full max-w-xl rounded-2xl border border-brand-yellow/15 bg-brand-dark-card/95 p-6 shadow-[0_28px_90px_rgba(25,26,31,0.8)] sm:max-w-2xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <VarLogo size={60} />
              <p className="text-xs uppercase tracking-[0.28em] text-brand-yellow">Trip Recap</p>
            </div>
            {tripLabel && (
              <p className="mt-2 text-sm font-medium text-white/70">{tripLabel}</p>
            )}
            <h1
              className={`text-3xl font-semibold text-white ${tripLabel ? "mt-1" : "mt-2"}`}
            >
              {itinerary.city.name}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Your trip, your reviews, your story.
            </p>
          </div>

          {/* Share button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShareMenuOpen((o) => !o)}
              className="rounded-lg bg-brand-yellow px-4 py-2 text-xs font-semibold text-brand-dark transition hover:bg-brand-yellow-light"
            >
              Share Trip
            </button>

            {shareMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-white/15 bg-brand-dark-card/95 p-2 shadow-2xl backdrop-blur-md"
              >
                <button
                  type="button"
                  onClick={shareToInstagram}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/8"
                >
                  <span className="text-lg">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-brand-yellow">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </span>
                  Instagram Story
                </button>
                <button
                  type="button"
                  onClick={shareViaText}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/8"
                >
                  <span className="text-lg">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-brand-yellow">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                  </span>
                  Text Message
                </button>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/8"
                >
                  <span className="text-lg">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-brand-yellow">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                  </span>
                  Copy to Clipboard
                </button>
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    type="button"
                    onClick={shareNative}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/8"
                  >
                    <span className="text-lg">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className="text-brand-yellow">
                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                      </svg>
                    </span>
                    More options...
                  </button>
                )}
              </motion.div>
            )}

            {copyFeedback && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 top-full z-50 mt-2 whitespace-nowrap rounded-lg bg-brand-dark-surface/90 border border-brand-yellow/30 px-3 py-1.5 text-xs text-brand-yellow"
              >
                {copyFeedback}
              </motion.p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <RecapHighlightsPanel
            recap={recap}
            expandedStopIds={expandedStopIds}
            onToggleStop={toggleStop}
          />
        </div>

        <section className="mt-10 rounded-xl border border-white/10 bg-brand-dark/50 p-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">Your Property Reviews</p>
          <ul className="mt-3 space-y-4">
            {itinerary.stops.map((stop) => {
              const answers = answersByStopId[stop.id] ?? [];
              const ai = synthesizedByStop?.[stop.id];
              return (
                <li key={stop.id} className="border-t border-white/5 pt-3 first:border-t-0 first:pt-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-white">{stop.name}</span>
                    <span className="text-xs capitalize text-white/50">{stop.type}</span>
                  </div>

                  {ai && (
                    <div className="mt-3 rounded-lg border border-brand-yellow/25 bg-brand-dark-surface/60 px-3 py-2.5">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-brand-yellow">
                        AI-generated review
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">{ai.review_title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/70">{ai.review_body}</p>
                    </div>
                  )}

                  <dl className="mt-3 space-y-1.5">
                    {stop.questions.map((q, i) => (
                      <div key={q}>
                        <dt className="text-[11px] text-white/50">{q}</dt>
                        <dd className="text-sm text-white/80">
                          {answers[i]?.trim() ? answers[i] : "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Powered by VAR footer */}
        <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
          <VarLogo size={40} />
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            Powered by VAR
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={onReplay}
            className="rounded-xl bg-brand-yellow px-4 py-3 text-sm font-semibold text-brand-dark transition hover:bg-brand-yellow-light"
          >
            Replay this trip
          </button>
          <button
            type="button"
            onClick={onBackToSetup}
            className="rounded-xl border border-white/20 bg-brand-dark-surface px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-dark-card"
          >
            Back to setup
          </button>
          <button
            type="button"
            onClick={onResetToDemo}
            className="rounded-xl border border-brand-yellow/25 bg-brand-dark/50 px-4 py-3 text-sm font-medium text-brand-yellow transition hover:bg-brand-dark-card"
          >
            Reset to demo
          </button>
        </div>
      </div>
    </motion.div>
  );
}
