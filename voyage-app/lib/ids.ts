export function generateStopId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `stop-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `stop-${Date.now().toString(36)}`;
}
