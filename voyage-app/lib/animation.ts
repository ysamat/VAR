export type ScenePhase =
  | "loading"
  | "intro"
  | "departure"
  | "flight"
  | "destination-emphasis"
  | "stop-reveal"
  | "review";

export const SCENE_TIMINGS = {
  introPauseMs: 500,
  /** Opening view → departure city (origin) */
  toDepartureMs: 2000,
  /** Brief hold on departure before the flight leg */
  departureSettleMs: 450,
  /** Departure → destination; matches arc dash animation */
  flightMs: 3400,
  destinationEmphasisMs: 900,
  stopRevealMs: 700,
} as const;

export const CAMERA = {
  initial: { lat: 46, lng: -25, altitude: 2.35 },
  /** Framing for the origin city before the route animates */
  departure: { altitude: 1.72 },
  destination: { altitude: 1.52 },
} as const;

export const wait = (durationMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, durationMs));

/** Globe crossfade into Mapbox scene — tune in `ExperienceFlow`. */
export const GLOBE_TO_MAP_CROSSFADE_MS = 920;

/** Brief beat after map camera settles before showing the review card. */
export const PRE_STOP_REVIEW_DELAY_MS = 480;
