import { Config } from "@/constants/config";
import { supabase } from "@/services/supabase/client";
import type { Screening } from "@/types/domain";
import type {
  PredictSuccessResponse,
  SaveScreeningPayload,
} from "@/types/screening";
import { toSaveScreeningPayload } from "@/types/screening";
import { MOCK_SCREENINGS } from "../mock-data";

export interface SaveScreeningInput {
  child_id: string;
  response: PredictSuccessResponse;
}

function normalizePayload(
  input: SaveScreeningPayload | SaveScreeningInput,
): SaveScreeningPayload {
  if ("response" in input) {
    return toSaveScreeningPayload(input.child_id, input.response);
  }
  return input;
}

const mockScreenings = [...MOCK_SCREENINGS];

const mockService = {
  save: async (
    input: SaveScreeningPayload | SaveScreeningInput,
  ): Promise<Screening> => {
    await new Promise((r) => setTimeout(r, 300));
    const payload = normalizePayload(input);
    const screening: Screening = {
      id: `scr-${Date.now()}`,
      child_id: payload.child_id,
      result: payload.result,
      agreement: payload.agreement,
      ae_error: payload.ae_error,
      ae_threshold: payload.ae_threshold,
      ocsvm_score: payload.ocsvm_score,
      chunks: payload.chunks,
      duration_sec: payload.duration_sec,
      waveform: payload.waveform,
      summary: payload.summary,
      model_version: payload.model_version,
      created_at: new Date().toISOString(),
    };
    mockScreenings.unshift(screening);
    return screening;
  },
  listByChild: async (childId: string, limit = 50): Promise<Screening[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return mockScreenings
      .filter((s) => s.child_id === childId)
      .slice(0, limit)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  },
  get: async (id: string): Promise<Screening | null> => {
    await new Promise((r) => setTimeout(r, 200));
    return mockScreenings.find((s) => s.id === id) ?? null;
  },
  latest: async (childId: string): Promise<Screening | null> => {
    await new Promise((r) => setTimeout(r, 200));
    const results = mockScreenings
      .filter((s) => s.child_id === childId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    return results[0] ?? null;
  },
};

const supabaseService = {
  save: async (
    input: SaveScreeningPayload | SaveScreeningInput,
  ): Promise<Screening> => {
    const payload = normalizePayload(input);
    const { data, error } = await supabase
      .from("screenings")
      .insert({
        child_id: payload.child_id,
        result: payload.result,
        agreement: payload.agreement,
        ae_error: payload.ae_error,
        ae_threshold: payload.ae_threshold,
        ocsvm_score: payload.ocsvm_score,
        chunks: payload.chunks,
        duration_sec: payload.duration_sec,
        waveform: payload.waveform,
        summary: payload.summary,
        model_version: payload.model_version,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  listByChild: async (childId: string, limit = 50): Promise<Screening[]> => {
    const { data, error } = await supabase
      .from("screenings")
      .select("*")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  get: async (id: string): Promise<Screening | null> => {
    const { data, error } = await supabase
      .from("screenings")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return null;
    return data;
  },
  latest: async (childId: string): Promise<Screening | null> => {
    const { data, error } = await supabase
      .from("screenings")
      .select("*")
      .eq("child_id", childId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data;
  },
};

export const screeningsService = Config.useMockData
  ? mockService
  : supabaseService;
