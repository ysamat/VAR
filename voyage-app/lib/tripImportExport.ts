import { tripConfigSchema, type TripConfig } from "@/lib/tripSchema";

export type ParseTripJsonResult =
  | { ok: true; data: TripConfig }
  | { ok: false; error: string };

export function parseTripConfigJson(raw: string): ParseTripJsonResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Invalid JSON — could not parse file." };
  }

  const result = tripConfigSchema.safeParse(parsed);
  if (!result.success) {
    const first = result.error.issues[0];
    const path = first?.path?.length ? `${first.path.join(".")}: ` : "";
    return {
      ok: false,
      error: `${path}${first?.message ?? "Validation failed."}`,
    };
  }

  return { ok: true, data: result.data };
}

export function serializeTripConfig(config: TripConfig): string {
  return JSON.stringify(config, null, 2);
}

export function downloadTripConfig(config: TripConfig, filename = "custom-trip.json") {
  const blob = new Blob([serializeTripConfig(config)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
