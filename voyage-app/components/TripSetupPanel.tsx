"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_DEMO_TRIP_CONFIG,
  FALLBACK_PROPERTIES,
  buildTripFromProperty,
  type PropertySummary,
} from "@/lib/presets";
import { downloadTripConfig, parseTripConfigJson } from "@/lib/tripImportExport";
import { tripConfigSchema, type TripConfig } from "@/lib/tripSchema";

type TripSetupPanelProps = {
  seedConfig: TripConfig;
  onStart: (config: TripConfig, label?: string) => void;
};

function propertyLabel(p: PropertySummary): string {
  const place = [p.city, p.province, p.country].filter(Boolean).join(", ");
  const star = p.star_rating ? ` · ${p.star_rating}★` : "";
  return `${place || "Unknown"}${star} · via ${p.airport.iata}`;
}

export function TripSetupPanel({ seedConfig: _seedConfig, onStart }: TripSetupPanelProps) {
  const [properties, setProperties] = useState<PropertySummary[]>(FALLBACK_PROPERTIES);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>(
    FALLBACK_PROPERTIES[0]?.eg_property_id ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch the real property list from the backend.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/properties");
        if (!res.ok) throw new Error(`Failed to load properties (${res.status})`);
        const json = await res.json();
        if (cancelled) return;
        const list: PropertySummary[] = json.properties ?? [];
        if (list.length > 0) {
          setProperties(list);
          setSelectedId(list[0].eg_property_id);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? "Failed to load properties");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = useMemo(
    () => properties.find((p) => p.eg_property_id === selectedId) ?? properties[0],
    [properties, selectedId]
  );

  const commitIfValid = (config: TripConfig, label?: string) => {
    const result = tripConfigSchema.safeParse(config);
    if (!result.success) {
      const first = result.error.issues[0];
      const path = first.path.length ? `${first.path.join(".")}: ` : "";
      setError(`${path}${first.message}`);
      return false;
    }
    setError(null);
    onStart(structuredClone(result.data), label);
    return true;
  };

  const handleStart = () => {
    if (!selected) {
      setError("Select a destination first");
      return;
    }
    const config = buildTripFromProperty(selected);
    const label = [selected.city, selected.country].filter(Boolean).join(", ");
    commitIfValid(config, label || "Property");
  };

  return (
    <div className="relative z-20 min-h-screen w-full bg-brand-yellow">
      {/* Subtle dotted texture + corner glow to keep the yellow from feeling flat */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #1A1F3A 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.55),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(26,31,58,0.12),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-14">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col items-center text-center"
        >
          {/* Plain <img> (not next/image) so the transparent PNG is served byte-for-byte
              without going through Next's image optimizer, which can flatten alpha. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="VAR"
            style={{
              height: 320,
              width: "auto",
              maxWidth: "min(560px, 88vw)",
              objectFit: "contain",
              background: "transparent",
            }}
          />
          <p className="mt-4 text-xs uppercase tracking-[0.35em] text-brand-navy/70">
            Trip Recap &amp; Review
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
            Relive your trip. Review your stays.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-brand-navy/70">
            Every trip departs JFK. Pick a destination — we&apos;ll fly you there, land at the
            nearest airport, bring you to the property, and ask a few AI-generated questions
            about your stay.
          </p>
        </motion.header>

        {/* Destination picker */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-brand-navy/15 bg-white/70 p-6 shadow-[0_20px_60px_-20px_rgba(26,31,58,0.35)] backdrop-blur-md"
        >
          <label className="block text-[11px] font-semibold uppercase tracking-[0.25em] text-brand-navy/80">
            Choose your destination
          </label>

          <div className="relative mt-3">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loading || properties.length === 0}
              className="w-full appearance-none rounded-xl border border-brand-navy/20 bg-white px-4 py-3.5 pr-10 text-sm font-medium text-brand-navy transition focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20 disabled:opacity-60"
            >
              {loading && <option>Loading destinations…</option>}
              {!loading &&
                properties.map((p) => (
                  <option key={p.eg_property_id} value={p.eg_property_id}>
                    {propertyLabel(p)}
                  </option>
                ))}
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-navy"
              width="14"
              height="14"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 7l5 5 5-5H5z" />
            </svg>
          </div>

          {selected && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-navy/10 bg-brand-yellow-soft/60 px-4 py-3 text-xs text-brand-navy/80">
              <div>
                <div className="font-semibold text-brand-navy">
                  JFK → {selected.airport.iata} → {selected.city ?? "Property"}
                </div>
                <div className="mt-0.5 text-brand-navy/60">
                  {selected.airport.name}
                  {selected.guestrating_avg_expedia
                    ? ` · ${selected.guestrating_avg_expedia.toFixed(1)}/10 Expedia`
                    : ""}
                </div>
              </div>
              <div className="font-semibold text-brand-navy">
                {selected.lat.toFixed(2)}°, {selected.lng.toFixed(2)}°
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={loading || !selected}
            className="mt-5 w-full rounded-xl bg-brand-navy px-6 py-3.5 text-sm font-semibold text-brand-yellow shadow-lg shadow-brand-navy/25 transition hover:bg-brand-navy-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start trip →
          </button>
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-brand-navy/25 bg-white/40 px-4 py-2 text-xs font-medium text-brand-navy transition hover:bg-white/70"
          >
            Import trip JSON
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selected) return;
              downloadTripConfig(buildTripFromProperty(selected), "trip.json");
            }}
            className="rounded-lg border border-brand-navy/25 bg-white/40 px-4 py-2 text-xs font-medium text-brand-navy transition hover:bg-white/70"
          >
            Export trip JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const parsed = parseTripConfigJson(String(reader.result));
                if (!parsed.ok) {
                  setError(parsed.error);
                  return;
                }
                commitIfValid(parsed.data, "Imported trip");
              };
              reader.readAsText(file);
              e.target.value = "";
            }}
          />
        </div>

        {error && (
          <p className="mx-auto mt-6 max-w-xl rounded-xl border border-rose-600/40 bg-white/80 px-4 py-3 text-center text-sm font-medium text-rose-700">
            {error}
          </p>
        )}

        {/* Silence unused-var lint — we still accept DEFAULT_DEMO_TRIP_CONFIG as the
            seed type contract but the dropdown drives the real config. */}
        <span className="hidden">{DEFAULT_DEMO_TRIP_CONFIG.stops[0].id}</span>
      </div>
    </div>
  );
}
