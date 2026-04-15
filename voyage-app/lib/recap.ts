import type { TripConfig } from "@/lib/tripSchema";

export type LocalRecap = {
  recapText: string;
  visitedStopNames: string[];
  stopCards: Array<{
    stopId: string;
    stopName: string;
    stopType: string;
    answers: string[];
    shortLabel: string;
  }>;
  futureMeTips: string[];
};

function tripFlavorLabel(stops: TripConfig["stops"]): "food-forward" | "sightseeing-forward" | "mixed" {
  const foodish = stops.filter(
    (s) =>
      /restaurant|food|market|cafe|dinner|bistro|bar/i.test(s.type) ||
      /dinner|food|market|café|lunch/i.test(s.name),
  ).length;
  const ratio = foodish / Math.max(stops.length, 1);
  if (ratio >= 0.45) return "food-forward";
  if (ratio === 0) return "sightseeing-forward";
  return "mixed";
}

/**
 * Deterministic recap from trip config + answers only (no network / LLM).
 * Tune copy in templates here.
 */
export function buildLocalRecap(
  config: TripConfig,
  answersByStopId: Record<string, string[]>,
): LocalRecap {
  const { flight, stops } = config;
  const visitedStopNames = stops.map((s) => s.name);
  const origin = flight.origin.name;
  const dest = flight.destination.name;
  const n = stops.length;
  const flavor = tripFlavorLabel(stops);

  const flavorPhrase =
    flavor === "food-forward"
      ? "with a food-forward rhythm"
      : flavor === "sightseeing-forward"
        ? "focused on sights and landmarks"
        : "blending bites and landmarks";

  const nameSample = visitedStopNames.slice(0, 3);
  const nameTail =
    n <= 3
      ? nameSample.join(", ")
      : `${nameSample.slice(0, 2).join(", ")}, and ${n - 2} more`;

  const recapText = `From ${origin} to ${dest}, you sketched ${n} stops ${flavorPhrase}. Along the way: ${nameTail}. The cards below preserve what you noticed — a straight line from memory to recap.`;

  const stopCards = stops.map((s, i) => {
    const answers = answersByStopId[s.id] ?? [];
    const joined = answers.filter((a) => a.trim()).join(" ");
    const shortLabel =
      joined.length > 96 ? `${joined.slice(0, 93).trim()}…` : joined || `Note ${i + 1} — add detail next time`;

    return {
      stopId: s.id,
      stopName: s.name,
      stopType: s.type,
      answers,
      shortLabel,
    };
  });

  const futureMeTips = stops
    .map((s) => {
      const tip = answersByStopId[s.id]?.[2]?.trim();
      return tip ? { stop: s.name, tip } : null;
    })
    .filter((x): x is { stop: string; tip: string } => x !== null)
    .map(({ stop, tip }) => `${stop}: ${tip}`);

  return {
    recapText,
    visitedStopNames,
    stopCards,
    futureMeTips,
  };
}
