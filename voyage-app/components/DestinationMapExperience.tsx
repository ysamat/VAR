"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildRouteLineString,
  buildStopsFeatureCollection,
  cityInitialView,
  FLY_TO_STOP,
  MAP_STYLE_URL,
  ROUTE_GLOW_LAYOUT,
  ROUTE_LINE_LAYOUT,
  STOP_CIRCLE_STYLES,
} from "@/lib/map";
import type { Itinerary } from "@/lib/itineraryData";
import { PRE_STOP_REVIEW_DELAY_MS } from "@/lib/animation";
import { StopReviewCard, type AIQuestions } from "@/components/StopReviewCard";

export type ReviewMeta = {
  gap_question: string;
  verification_question: string;
  verification_type: "positive" | "negative";
};

export type StopAnswerData = {
  answers: string[];
  eg_property_id?: string;
  meta?: ReviewMeta;
};

type DestinationMapExperienceProps = {
  itinerary: Itinerary;
  mapboxToken: string | undefined;
  showReviewUI: boolean;
  onItineraryComplete: (answersByStopId: Record<string, StopAnswerData>) => void;
};

export function DestinationMapExperience({
  itinerary,
  mapboxToken,
  showReviewUI,
  onItineraryComplete,
}: DestinationMapExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [answersByStopId, setAnswersByStopId] = useState<Record<string, StopAnswerData>>({});
  const [reviewReady, setReviewReady] = useState(false);

  // AI question state for the active stop
  const [aiQuestions, setAiQuestions] = useState<AIQuestions | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const flyToStop = useCallback(
    (index: number) => {
      const map = mapRef.current;
      if (!map) return;
      const stop = itinerary.stops[index];
      if (!stop) return;
      const cam = stop.camera;
      const bearing =
        cam?.bearing ??
        FLY_TO_STOP.bearing + index * 11.5 - (itinerary.stops.length - 1) * 5.5;
      const zoomBoost = /historic|landmark|monument|temple|tower|skytree/i.test(
        `${stop.type} ${stop.name}`,
      )
        ? 0.3
        : 0;
      const zoom = cam?.zoom ?? FLY_TO_STOP.zoom + zoomBoost;
      map.flyTo({
        center: [stop.lng, stop.lat],
        zoom,
        pitch: cam?.pitch ?? FLY_TO_STOP.pitch,
        bearing,
        duration: cam?.durationMs ?? FLY_TO_STOP.durationMs,
        essential: true,
      });
    },
    [itinerary],
  );

  const updateStopsSource = useCallback(
    (map: mapboxgl.Map, activeId: string) => {
      const source = map.getSource("stops") as mapboxgl.GeoJSONSource | undefined;
      if (!source) return;
      source.setData(
        buildStopsFeatureCollection(
          itinerary.stops.map((s) => ({
            id: s.id,
            name: s.name,
            lng: s.lng,
            lat: s.lat,
          })),
          activeId,
        ),
      );
    },
    [itinerary],
  );

  // Fetch AI questions when a stop with eg_property_id becomes active
  useEffect(() => {
    const stop = itinerary.stops[activeStopIndex];
    if (!stop?.eg_property_id || !reviewReady) {
      setAiQuestions(null);
      return;
    }

    let cancelled = false;
    setLoadingQuestions(true);
    setAiQuestions(null);

    fetch(`/api/properties/${encodeURIComponent(stop.eg_property_id)}/questions`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          setAiQuestions(data);
        }
      })
      .catch(() => {
        // Fall back to hardcoded questions on error
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStopIndex, reviewReady, itinerary.stops]);

  useEffect(() => {
    if (!mapboxToken || !containerRef.current) {
      return;
    }

    const initialView = cityInitialView(itinerary.city);
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: initialView.center,
      zoom: initialView.zoom,
      pitch: initialView.pitch,
      bearing: initialView.bearing,
      antialias: true,
    });
    mapRef.current = map;

    const onResize = () => map.resize();
    window.addEventListener("resize", onResize);

    map.on("load", () => {
      const route = buildRouteLineString(itinerary.stops);
      map.addSource("route", {
        type: "geojson",
        data: route,
      });
      map.addLayer({
        id: "route-glow",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ROUTE_GLOW_LAYOUT.lineColor,
          "line-width": ROUTE_GLOW_LAYOUT.lineWidth,
          "line-opacity": ROUTE_GLOW_LAYOUT.lineOpacity,
          "line-blur": ROUTE_GLOW_LAYOUT.lineBlur,
        },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ROUTE_LINE_LAYOUT.lineColor,
          "line-width": ROUTE_LINE_LAYOUT.lineWidth,
          "line-opacity": ROUTE_LINE_LAYOUT.lineOpacity,
        },
      });

      map.addSource("stops", {
        type: "geojson",
        data: buildStopsFeatureCollection(
          itinerary.stops.map((s) => ({
            id: s.id,
            name: s.name,
            lng: s.lng,
            lat: s.lat,
          })),
          itinerary.stops[0]?.id ?? null,
        ),
      });
      map.addLayer({
        id: "stops-circle",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "isActive"], true],
            STOP_CIRCLE_STYLES.active.radius,
            STOP_CIRCLE_STYLES.inactive.radius,
          ],
          "circle-color": [
            "case",
            ["==", ["get", "isActive"], true],
            STOP_CIRCLE_STYLES.active.color,
            STOP_CIRCLE_STYLES.inactive.color,
          ],
          "circle-opacity": [
            "case",
            ["==", ["get", "isActive"], true],
            STOP_CIRCLE_STYLES.active.opacity,
            STOP_CIRCLE_STYLES.inactive.opacity,
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#0f172a",
        },
      });

      setMapLoaded(true);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, itinerary]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !showReviewUI) {
      setReviewReady(false);
      return;
    }
    const stop = itinerary.stops[activeStopIndex];
    if (!stop) return;

    setReviewReady(false);
    updateStopsSource(map, stop.id);
    flyToStop(activeStopIndex);

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const onMoveEnd = () => {
      timer = setTimeout(() => {
        if (!cancelled) setReviewReady(true);
      }, PRE_STOP_REVIEW_DELAY_MS);
    };

    map.once("moveend", onMoveEnd);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      map.off("moveend", onMoveEnd);
    };
  }, [activeStopIndex, mapLoaded, showReviewUI, itinerary, flyToStop, updateStopsSource]);

  const handleContinue = (
    answers: string[],
    meta?: {
      gap_question: string;
      verification_question: string;
      verification_type: "positive" | "negative";
    }
  ) => {
    const stop = itinerary.stops[activeStopIndex];
    if (!stop) return;

    const stopData: StopAnswerData = {
      answers,
      eg_property_id: stop.eg_property_id,
      meta,
    };

    const merged = { ...answersByStopId, [stop.id]: stopData };
    setAnswersByStopId(merged);

    if (activeStopIndex >= itinerary.stops.length - 1) {
      onItineraryComplete(merged);
      return;
    }
    setAiQuestions(null);
    setActiveStopIndex((i) => i + 1);
  };

  if (!mapboxToken) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-slate-950 px-6 text-center">
        <p className="max-w-md text-sm text-slate-300">
          Add a{" "}
          <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sky-300">
            NEXT_PUBLIC_MAPBOX_TOKEN
          </code>{" "}
          to your environment to load the destination map. See README for details.
        </p>
      </div>
    );
  }

  const activeStop = itinerary.stops[activeStopIndex];

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      {mapLoaded && showReviewUI && reviewReady && activeStop && (
        <StopReviewCard
          key={activeStop.id}
          stopIndex={activeStopIndex}
          totalStops={itinerary.stops.length}
          stopName={activeStop.name}
          stopType={activeStop.type}
          questions={activeStop.questions}
          aiQuestions={aiQuestions}
          loadingQuestions={loadingQuestions}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
