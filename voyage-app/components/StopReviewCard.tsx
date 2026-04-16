"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex: number;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

export type AIQuestions = {
  gap_question: { question: string; target_gap: string };
  verification_question: {
    question: string;
    type: "positive" | "negative";
    source_topic: string;
    source_excerpt: string;
  };
  debug?: {
    missing_info_areas: Array<{
      category: string;
      description: string;
      priority: number;
    }>;
    selected_gap: {
      category: string;
      description: string;
      priority: number;
    };
    selected_verification_topic: {
      topic: string;
      sentiment: "positive" | "negative" | "neutral";
      severity: number;
      weight: number;
      score: number;
      excerpt: string;
    } | null;
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
      target_gap?: string;
      gap_priority?: number;
      gap_description?: string;
      missing_info_areas?: Array<{ category: string; description: string; priority: number }>;
      verification_topic?: string;
      verification_excerpt?: string;
      verification_weight?: number;
      verification_severity?: number;
      verification_score?: number;
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
  const [listeningIndex, setListeningIndex] = useState<number | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const debounceTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const supportsSpeechSynthesis =
    typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined";
  const supportsSpeechRecognition =
    typeof window !== "undefined" &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);

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

  useEffect(() => {
    if (!supportsSpeechSynthesis) return;
    const synth = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
    };
  }, [supportsSpeechSynthesis]);

  const handleReadQuestion = async (question: string, index: number) => {
    if (!question.trim()) return;
    setSpeechError(null);
    setSpeakingIndex(index);

    // Stop any previous playback.
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    try {
      const res = await fetch("/api/reviews/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeakingIndex((prev) => (prev === index ? null : prev));
      audio.onerror = () => {
        setSpeechError("Could not play generated audio.");
        setSpeakingIndex((prev) => (prev === index ? null : prev));
      };
      await audio.play();
      return;
    } catch {
      // Fall back to browser synthesis as a backup path.
    }

    if (!supportsSpeechSynthesis) {
      setSpeechError("Read aloud is not supported in this browser.");
      setSpeakingIndex(null);
      return;
    }

    const synth = window.speechSynthesis;
    if (synth.paused) synth.resume();
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    const preferredVoice =
      availableVoices.find((v) => v.lang.toLowerCase().startsWith("en")) ?? null;
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = preferredVoice?.lang ?? "en-US";
    utterance.volume = 1;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingIndex((prev) => (prev === index ? null : prev));
    utterance.onerror = () => {
      setSpeechError("Could not play read aloud audio. Please try again.");
      setSpeakingIndex((prev) => (prev === index ? null : prev));
    };
    window.setTimeout(() => synth.speak(utterance), 80);
  };

  const handleVoiceAnswer = (index: number) => {
    setSpeechError(null);
    if (!supportsSpeechRecognition) {
      setSpeechError("Voice input is not supported in this browser.");
      return;
    }

    if (listeningIndex === index && recognitionRef.current) {
      recognitionRef.current.stop();
      setListeningIndex(null);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechError("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new Ctor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      const transcript = result?.[0]?.transcript?.trim();
      if (!transcript) return;
      const current = answers[index] ?? "";
      const merged = current ? `${current} ${transcript}` : transcript;
      handleChange(index, merged);
    };
    recognition.onerror = () => {
      setSpeechError("Could not capture voice input. Please try again.");
      setListeningIndex(null);
    };
    recognition.onend = () => {
      setListeningIndex((active) => (active === index ? null : active));
    };

    recognitionRef.current = recognition;
    setListeningIndex(index);
    recognition.start();
  };

  const handleSubmit = () => {
    if (isAI) {
      onContinue(answers, {
        gap_question: aiQuestions!.gap_question.question,
        verification_question: aiQuestions!.verification_question.question,
        verification_type: aiQuestions!.verification_question.type,
        target_gap: aiQuestions!.gap_question.target_gap,
        gap_priority: aiQuestions!.debug?.selected_gap.priority,
        gap_description: aiQuestions!.debug?.selected_gap.description,
        missing_info_areas: aiQuestions!.debug?.missing_info_areas,
        verification_topic: aiQuestions!.verification_question.source_topic,
        verification_excerpt: aiQuestions!.verification_question.source_excerpt,
        verification_weight: aiQuestions!.debug?.selected_verification_topic?.weight,
        verification_severity: aiQuestions!.debug?.selected_verification_topic?.severity,
        verification_score: aiQuestions!.debug?.selected_verification_topic?.score,
      });
    } else {
      onContinue(answers);
    }
  };

  // Cleanup debounce timers
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((t) => clearTimeout(t));
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
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
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReadQuestion(question, index)}
                    className={`rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-wide transition ${
                      speakingIndex === index
                        ? "border-brand-yellow bg-brand-yellow/15 text-brand-yellow"
                        : "border-white/15 text-white/75 hover:border-brand-yellow/60 hover:text-brand-yellow"
                    }`}
                  >
                    {speakingIndex === index ? "Playing..." : "Read aloud"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoiceAnswer(index)}
                    disabled={!supportsSpeechRecognition}
                    className={`rounded-md border px-2.5 py-1 text-[11px] uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      listeningIndex === index
                        ? "border-brand-yellow bg-brand-yellow/15 text-brand-yellow"
                        : "border-white/15 text-white/75 hover:border-brand-yellow/60 hover:text-brand-yellow"
                    }`}
                  >
                    {listeningIndex === index ? "Stop listening" : "Voice answer"}
                  </button>
                </div>
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
                {speechError && (
                  <p className="text-xs text-rose-300">{speechError}</p>
                )}
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
