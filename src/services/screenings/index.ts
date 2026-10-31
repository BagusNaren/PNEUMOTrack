// src/services/screenings/index.ts
// Screenings service — saves and retrieves skrining results.
// Note: Audio is never stored; only the structured result is persisted (PRD §13).

import { Config } from '@/constants/config';
import { supabase } from '@/services/supabase/client';
import type { Screening } from '@/types/domain';
import type { PredictResponse } from '@/types/screening';
import { MOCK_SCREENINGS } from '../mock-data';

export interface SaveScreeningInput {
  child_id: string;
  response: PredictResponse;
}

const mockScreenings = [...MOCK_SCREENINGS];

// Mock implementation
const mockService = {
  save: async (input: SaveScreeningInput): Promise<Screening> => {
    await new Promise((r) => setTimeout(r, 300));
    const screening: Screening = {
      id: `scr-${Date.now()}`,
      child_id: input.child_id,
      result: input.response.result,
      agreement: input.response.agreement,
      ae_error: input.response.autoencoder.error,
      ae_threshold: input.response.autoencoder.threshold,
      ocsvm_score: input.response.ocsvm.score,
      chunks: input.response.chunks,
      duration_sec: input.response.duration_sec,
      waveform: input.response.waveform,
      summary: input.response.summary,
      model_version: input.response.model_version,
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
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
  get: async (id: string): Promise<Screening | null> => {
    await new Promise((r) => setTimeout(r, 200));
    return mockScreenings.find((s) => s.id === id) ?? null;
  },
  latest: async (childId: string): Promise<Screening | null> => {
    await new Promise((r) => setTimeout(r, 200));
    const results = mockScreenings
      .filter((s) => s.child_id === childId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return results[0] ?? null;
  },
};

// Supabase implementation
const supabaseService = {
  save: async (input: SaveScreeningInput): Promise<Screening> => {
    const { data, error } = await supabase
      .from('screenings')
      .insert({
        child_id: input.child_id,
        result: input.response.result,
        agreement: input.response.agreement,
        ae_error: input.response.autoencoder.error,
        ae_threshold: input.response.autoencoder.threshold,
        ocsvm_score: input.response.ocsvm.score,
        chunks: input.response.chunks,
        duration_sec: input.response.duration_sec,
        waveform: input.response.waveform,
        summary: input.response.summary,
        model_version: input.response.model_version,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  listByChild: async (childId: string, limit = 50): Promise<Screening[]> => {
    const { data, error } = await supabase
      .from('screenings')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  get: async (id: string): Promise<Screening | null> => {
    const { data, error } = await supabase.from('screenings').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },
  latest: async (childId: string): Promise<Screening | null> => {
    const { data, error } = await supabase
      .from('screenings')
      .select('*')
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data;
  },
};

export const screeningsService = Config.useMockData ? mockService : supabaseService;
