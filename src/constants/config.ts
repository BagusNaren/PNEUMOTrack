export const MIN_RECORD_DURATION_SEC = 3;
export const MAX_RECORD_DURATION_SEC = 30;
export const API_TIMEOUT_MS = 60_000;
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
export const DEFAULT_LAT = -8.6705;
export const DEFAULT_LNG = 115.2126;

function readFlag(value: string | undefined): boolean {
  return value === undefined ? __DEV__ : value === "true";
}

function readApiUrl(value: string | undefined): string | null {
  const candidate = value?.trim() || (__DEV__ ? "http://10.0.2.2:8000" : "");
  try {
    const url = new URL(candidate);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    if (!__DEV__ && url.protocol !== "https:") return null;
    if (url.search || url.hash) return null;
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const config = {
  apiUrl: readApiUrl(process.env.EXPO_PUBLIC_API_URL),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "",
  useMockApi: readFlag(process.env.EXPO_PUBLIC_USE_MOCK_API),
  useMockData: readFlag(process.env.EXPO_PUBLIC_USE_MOCK_DATA),
  defaultLat: DEFAULT_LAT,
  defaultLng: DEFAULT_LNG,
  minRecordingSeconds: MIN_RECORD_DURATION_SEC,
  maxRecordingSeconds: MAX_RECORD_DURATION_SEC,
  maxFileSizeMb: 10,
  apiTimeoutMs: API_TIMEOUT_MS,
} as const;

export const Config = config;
