"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";

export type AIQuestions = {
  gap_question: { question: string; target_gap: string };
  verification_question: {
    question: string;
    type: "positive" | "negative";
    source_topic: string;
    source_excerpt: string;
  };
};

type StopReviewCardProps = {
  stopIndex: number;
  totalStops: number;
  stopName: string;
  stopType: string;
  /** Fallback questions (from trip config). Overridden when aiQuestions is provided. */
  questions: string[];
  /** AI-generated questions from the backend (when eg_property_id is set). */
  aiQuestions?: AIQuestions | null;
  /** True while the parent is fetching AI questions */
  loadingQuestions?: boolean;
  onContinue: (
    answers: string[],
    meta?: {
      gap_question: string;
      verification_question: string;
      verification_type: "positive" | "negative";
    }
  ) => void;
};

export function StopReviewCard({
  stopIndex,
  totalStops,
  stopName,
  stopType,
  questions,
  aiQuestions,
  loadingQuestions,
  onContinue,
}: StopReviewCardProps) {
  const isAI = !!aiQuestions;
  const displayQuestions = isAI
    ? [aiQuestions!.gap_question.question, aiQuestions!.verification_question.question]
    : questions;

  const [answers, setAnswers] = useState<string[]>(() => displayQuestions.map(() => ""));
  const [typingSuggestions, setTypingSuggestions] = useState<(string | null)[]>(
    () => displayQuestions.map(() => null)
  );
  const debounceTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Reset answers when AI questions arrive
  const prevIsAI = useRef(isAI);
  useEffect(() => {
    if (isAI !== prevIsAI.current) {
      setAnswers(displayQuestions.map(() => ""));
      setTypingSuggestions(displayQuestions.map(() => null));
      prevIsAI.current = isAI;
    }
  }, [isAI, displayQuestions]);

  // Real-time typing analysis (only for AI-powered stops)
  const handleTypingAnalysis = useCallback(
    (index: number, text: string) => {
      if (!isAI) return;

      if (debounceTimers.current[index]) {
        clearTimeout(debounceTimers.current[index]);
      }

      debounceTimers.current[index] = setTimeout(async () => {
        if (text.trim().split(/\s+/).length < 3) {
          setTypingSuggestions((prev) => {
            const next = [...prev];
            next[index] = null;
            return next;
          });
          return;
        }

        try {
          const questionType = index === 0 ? "gap" : "verification";
          const res = await fetch("/api/reviews/analyze-typing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              partial_text: text,
              question: displayQuestions[index],
              question_type: questionType,
            }),
          });
          if (res.ok) {
            const analysis = await res.json();
            setTypingSuggestions((prev) => {
              const next = [...prev];
              next[index] = analysis.sufficient ? null : analysis.suggestion;
              return next;
            });
          }
        } catch {
          // Silently fail — nudges are non-critical
        }
      }, 1500);
    },
    [isAI, displayQuestions]
  );

  const handleChange = (index: number, value: string) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    handleTypingAnalysis(index, value);
  };

  const handleSubmit = () => {
    if (isAI) {
      onContinue(answers, {
        gap_question: aiQuestions!.gap_question.question,
        verification_question: aiQuestions!.verification_question.question,
        verification_type: aiQuestions!.verification_question.type,
      });
    } else {
      onContinue(answers);
    }
  };

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="absolute bottom-8 left-1/2 z-20 w-[min(92vw,34rem)] -translate-x-1/2 rounded-2xl border border-brand-yellow/20 bg-brand-dark-card/90 p-5 shadow-[0_20px_60px_rgba(25,26,31,0.7)] backdrop-blur-md md:left-8 md:translate-x-0"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-brand-yellow">
        Stop {stopIndex + 1} of {totalStops}
      </p>
      <h2 className="mt-1 text-2xl font-semibold text-white">{stopName}</h2>
      <p className="mt-1 text-sm capitalize text-white/60">{stopType}</p>

      {isAI && (
        <p className="mt-2 text-[11px] uppercase tracking-widest text-brand-yellow/70">
          AI-powered review
        </p>
      )}

      {loadingQuestions ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-white/50">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-yellow border-t-transparent" />
          Generating personalized questions...
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {displayQuestions.map((question, index) => (
              <div key={`${question}-${index}`} className="space-y-2">
                <p className="text-sm text-white/80">
                  {index + 1}. {question}
                </p>
                <textarea
                  value={answers[index] ?? ""}
                  onChange={(e) => handleChange(index, e.target.value)}
                  rows={2}
                  placeholder="Your thoughts..."
                  className="w-full resize-none rounded-lg border border-white/15 bg-brand-dark/70 px-3 py-2 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-brand-yellow"
                />
                {/* Typing analysis nudge */}
                <AnimatePresence>
                  {typingSuggestions[index] && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs italic text-brand-yellow/80"
                    >
                      {typingSuggestions[index]}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-5 w-full rounded-lg bg-brand-yellow px-4 py-2.5 text-sm font-semibold text-brand-dark transition hover:bg-brand-yellow-light sm:w-auto"
          >
            {stopIndex + 1 >= totalStops ? "Finish & review trip" : "Save & continue"}
          </button>
        </>
      )}
    </motion.aside>
  );
}
