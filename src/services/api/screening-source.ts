export type ScreeningEntrySource = "monitoring";

export type ScreeningRoutePathname =
  | "/screening/guide"
  | "/screening/record"
  | "/screening/analyzing"
  | "/screening/result";

export function parseScreeningSource(
  raw: string | readonly string[] | undefined,
): ScreeningEntrySource | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "monitoring" ? "monitoring" : undefined;
}

export function withScreeningSource<T extends ScreeningRoutePathname>(
  pathname: T,
  source?: ScreeningEntrySource,
): T | { pathname: T; params: { source: ScreeningEntrySource } } {
  if (source === "monitoring") {
    return { pathname, params: { source: "monitoring" } };
  }
  return pathname;
}

export function originHrefForSource(
  source?: ScreeningEntrySource,
): "/(tabs)/monitoring" | "/(tabs)" {
  return source === "monitoring" ? "/(tabs)/monitoring" : "/(tabs)";
}
