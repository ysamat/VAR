"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LocalRecap } from "@/lib/recap";

type RecapHighlightsPanelProps = {
  recap: LocalRecap;
  expandedStopIds: Set<string>;
  onToggleStop: (stopId: string) => void;
};

export function RecapHighlightsPanel({
  recap,
  expandedStopIds,
  onToggleStop,
}: RecapHighlightsPanelProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-brand-yellow/20 bg-gradient-to-br from-brand-dark-card/80 to-brand-dark/60 p-5">
        <p className="text-[11px] uppercase tracking-[0.28em] text-brand-yellow">Your recap</p>
        <p className="mt-3 text-base leading-relaxed text-white">{recap.recapText}</p>
      </section>

      <section>
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">Stops you visited</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {recap.visitedStopNames.map((name, i) => (
            <li
              key={`${name}-${i}`}
              className="rounded-full border border-brand-yellow/15 bg-brand-dark-card/60 px-3 py-1 text-xs text-white/80"
            >
              {name}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">Moment by moment</p>
        {recap.stopCards.map((card) => {
          const open = expandedStopIds.has(card.stopId);
          return (
            <div
              key={card.stopId}
              className="overflow-hidden rounded-xl border border-white/10 bg-brand-dark/45"
            >
              <button
                type="button"
                onClick={() => onToggleStop(card.stopId)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04]"
              >
                <div>
                  <span className="font-medium text-white">{card.stopName}</span>
                  <span className="ml-2 text-xs capitalize text-white/50">{card.stopType}</span>
                  <p className="mt-1 text-sm text-white/60">{card.shortLabel}</p>
                </div>
                <span className="shrink-0 text-brand-yellow">{open ? "−" : "+"}</span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-t border-white/5"
                  >
                    <dl className="space-y-2 px-4 py-3">
                      {card.answers.map((a, i) => (
                        <div key={i}>
                          <dt className="text-[10px] uppercase tracking-wider text-white/50">
                            Answer {i + 1}
                          </dt>
                          <dd className="text-sm text-white/80">{a.trim() || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </section>

      {recap.futureMeTips.length > 0 && (
        <section className="rounded-2xl border border-brand-yellow/20 bg-brand-dark-card/40 p-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-brand-yellow">
            Tips for future you
          </p>
          <p className="mt-2 text-xs text-white/40">
            Pulled from your third answer at each stop — grounded only in what you typed.
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-white/80">
            {recap.futureMeTips.map((t, i) => (
              <li key={`${i}-${t.slice(0, 24)}`}>{t}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
