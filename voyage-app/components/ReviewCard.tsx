"use client";

import { motion } from "framer-motion";

type ReviewCardProps = {
  variant?: "arrival" | "full";
  cityName: string;
  stopName: string;
  stopType: string;
  questions?: string[];
  onContinue?: () => void;
};

export function ReviewCard({
  variant = "full",
  cityName,
  stopName,
  stopType,
  questions = [],
  onContinue,
}: ReviewCardProps) {
  const isArrival = variant === "arrival";

  return (
    <motion.aside
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="absolute bottom-8 left-1/2 z-20 w-[min(92vw,34rem)] -translate-x-1/2 rounded-2xl border border-brand-yellow/20 bg-brand-dark-card/85 p-5 shadow-[0_20px_60px_rgba(25,26,31,0.7)] backdrop-blur-md md:left-8 md:translate-x-0"
    >
      {isArrival ? (
        <>
          <p className="text-xs uppercase tracking-[0.28em] text-brand-yellow">Arrival</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Welcome to {cityName}</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/60">
            You have landed. Your first stop is{" "}
            <span className="font-medium text-white">{stopName}</span> — a{" "}
            <span className="capitalize">{stopType}</span> that kicks off your trip.
          </p>
          <p className="mt-3 text-sm text-white/40">
            Next, review each property on the map — one stop at a time.
          </p>
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 w-full rounded-lg bg-brand-yellow px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-yellow-light sm:w-auto"
          >
            Continue to city map
          </button>
        </>
      ) : (
        <>
          <p className="text-xs uppercase tracking-[0.28em] text-brand-yellow">First stop</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{stopName}</h2>
          <p className="mt-1 text-sm capitalize text-white/60">{stopType}</p>

          <div className="mt-4 space-y-3">
            {questions.map((question, index) => (
              <div key={question} className="space-y-2">
                <p className="text-sm text-white/80">
                  {index + 1}. {question}
                </p>
                <textarea
                  rows={2}
                  placeholder="Share your experience..."
                  className="w-full resize-none rounded-lg border border-white/15 bg-brand-dark/70 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-yellow"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-5 rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-yellow-light"
          >
            Continue
          </button>
        </>
      )}
    </motion.aside>
  );
}
