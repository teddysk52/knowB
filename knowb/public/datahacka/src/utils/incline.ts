export function parseIncline(value: string | null | undefined): number | null {
  if (value == null || typeof value !== "string") return null;
  const s = value.trim();
  if (s === "") return null;
  const percentMatch = s.match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  if (percentMatch) return parseFloat(percentMatch[1]);
  if (s === "up" || s === "steep") return 15;
  if (s === "down") return -15;
  return null;
}
