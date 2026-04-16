import Link from "next/link";
import { getReviewQualitySummary } from "@/lib/backend/review-analytics-store";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const quality = getReviewQualitySummary(30);
  const verified = quality.verificationDecisions.filter((d) => d.status === "verified");
  const contradicted = quality.verificationDecisions.filter((d) => d.status === "contradicted");
  const unresolved = quality.verificationDecisions.filter((d) => d.status === "unclear");

  return (
    <main className="min-h-screen bg-brand-dark px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-yellow/90">
              Investor Demo
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Gap Fill + Verification Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/65">
              Reports exactly which selected gaps were filled and which prior statements
              were verified or contradicted by new review answers.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-brand-yellow/30 px-4 py-2 text-sm text-brand-yellow transition hover:bg-brand-yellow hover:text-brand-dark"
          >
            Back to demo flow
          </Link>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-brand-dark-card/80 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Captured Submissions</p>
            <p className="mt-2 text-3xl font-semibold">{quality.totals.events}</p>
          </div>
          <div className="rounded-xl border border-brand-yellow/30 bg-brand-dark-card/80 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Gap Fill Rate</p>
            <p className="mt-2 text-3xl font-semibold">
              {quality.totals.gapFillRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-brand-yellow/30 bg-brand-dark-card/80 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">
              Contradiction Resolution Rate
            </p>
            <p className="mt-2 text-3xl font-semibold">
              {quality.totals.contradictionResolutionRate.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-brand-dark-card/80 p-4">
            <p className="text-xs uppercase tracking-wide text-white/60">Verification Split</p>
            <p className="mt-2 text-sm text-white/75">
              Verified {quality.totals.verifiedCount} / Contradicted {quality.totals.contradictedCount} /
              Unclear {quality.totals.unclearCount}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-brand-dark-card/70 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Exact Gaps Filled</h2>
            <p className="text-xs uppercase tracking-wide text-white/50">
              Selected gaps now backed by new evidence
            </p>
          </div>

          {quality.filledGaps.length === 0 ? (
            <p className="rounded-lg border border-white/10 bg-brand-dark/50 p-4 text-sm text-white/60">
              No submissions yet. Complete the trip review flow to generate quality uplift events.
            </p>
          ) : (
            <div className="space-y-3">
              {quality.filledGaps.map((gap) => (
                <article key={gap.eventId} className="rounded-xl border border-white/10 bg-brand-dark/55 p-4">
                  <p className="text-xs text-white/50">Property {gap.propertyId}</p>
                  <p className="mt-1 text-sm text-white">
                    <span className="text-brand-yellow">{gap.category}</span> - {gap.description}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    Priority {gap.priority.toFixed(1)} | Evidence score {gap.evidenceScore.toFixed(1)}
                  </p>
                  <p className="mt-2 text-xs italic text-white/60">"{gap.evidenceSnippet}"</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-brand-dark-card/70 p-5">
            <h3 className="text-lg font-semibold">Selected Gaps Still Open</h3>
            {quality.openGaps.length === 0 ? (
              <p className="mt-2 text-sm text-white/60">No open selected gaps in sampled events.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {quality.openGaps.map((gap) => (
                  <li key={gap.eventId} className="rounded-lg border border-white/10 bg-brand-dark/50 p-3 text-xs">
                    <p className="text-white/75">
                      <span className="text-brand-yellow">{gap.category}</span> - {gap.description}
                    </p>
                    <p className="mt-1 text-white/50">Property {gap.propertyId}</p>
                    <p className="mt-1 text-white/55">{gap.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-white/10 bg-brand-dark-card/70 p-5">
            <h3 className="text-lg font-semibold">Verified vs Contradicted Statements</h3>
            <p className="mt-1 text-xs text-white/50">
              Exact historical statement excerpts and the new user answer outcome.
            </p>
            <div className="mt-3 space-y-2">
              {[...verified, ...contradicted, ...unresolved].map((d) => (
                <div key={d.eventId} className="rounded-lg border border-white/10 bg-brand-dark/50 p-3 text-xs">
                  <p className="text-white/70">Property {d.propertyId}</p>
                  <p className="mt-1 text-white/80">
                    <span className="text-brand-yellow">{d.topic}</span> | score {d.score.toFixed(1)}
                  </p>
                  <p className="mt-1 italic text-white/60">"{d.statement}"</p>
                  <p className="mt-1 text-white/70">Answer: "{d.answer}"</p>
                  <p
                    className={`mt-1 ${
                      d.status === "verified"
                        ? "text-emerald-300"
                        : d.status === "contradicted"
                          ? "text-rose-300"
                          : "text-amber-300"
                    }`}
                  >
                    {d.status.toUpperCase()}: {d.reason}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
