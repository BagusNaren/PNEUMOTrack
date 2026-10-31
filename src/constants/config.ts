// src/constants/config.ts
// Read and validate all EXPO_PUBLIC_* env variables. Never import secrets here.

const requireEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value && !fallback) {
    console.warn(`[config] Missing env var: ${key}`);
  }
  return value ?? '';
};

export const Config = {
  /** FastAPI backend URL. Required for prediction. */
  apiUrl: requireEnv('EXPO_PUBLIC_API_URL', 'http://localhost:8000'),

  /** Supabase project URL */
  supabaseUrl: requireEnv('EXPO_PUBLIC_SUPABASE_URL', ''),

  /** Supabase anon (public) key */
  supabaseAnonKey: requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', ''),

  /** Use mock API instead of real backend */
  useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API === 'true',

  /** Use mock data for Supabase tables */
  useMockData: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true',

  /** Default demo city for location fallback */
  defaultLat: -8.6705, // Denpasar, Bali
  defaultLng: 115.2126,

  /** Screening limits */
  minRecordingSeconds: 3,
  maxRecordingSeconds: 30,
  maxFileSizeMb: 10,

  /** API timeout */
  apiTimeoutMs: 60_000,
} as const;
