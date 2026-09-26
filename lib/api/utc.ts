// Every timestamp the API sends is UTC. Older builds serialise them without a "Z" ("2026-09-26T18:54:00.4294841"),
// which browsers read as *local* time — so orders showed up hours off for anyone outside UTC. Tag them as UTC here.
const OFFSET_LESS_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;

export function normalizeUtc<T>(value: T): T {
  if (typeof value === "string") return (OFFSET_LESS_ISO.test(value) ? `${value}Z` : value) as T;
  if (Array.isArray(value)) return value.map(normalizeUtc) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeUtc(item)])) as T;
  }
  return value;
}
