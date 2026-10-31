// src/services/hospitals/index.ts
// Hospitals service with haversine distance calculation.

import { Config } from '@/constants/config';
import { supabase } from '@/services/supabase/client';
import type { Hospital } from '@/types/domain';
import { MOCK_HOSPITALS } from '../mock-data';

/** Haversine distance in kilometers */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock implementation
const mockService = {
  list: async (query?: string): Promise<Hospital[]> => {
    await new Promise((r) => setTimeout(r, 400));
    if (!query) return [...MOCK_HOSPITALS];
    const q = query.toLowerCase();
    return MOCK_HOSPITALS.filter(
      (h) => h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q),
    );
  },
  nearest: async (lat: number, lng: number, limit = 10): Promise<Hospital[]> => {
    await new Promise((r) => setTimeout(r, 400));
    return [...MOCK_HOSPITALS]
      .map((h) => ({ ...h, distance_km: haversineKm(lat, lng, h.lat, h.lng) }))
      .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
      .slice(0, limit);
  },
};

// Supabase implementation
const supabaseService = {
  list: async (query?: string): Promise<Hospital[]> => {
    let q = supabase.from('hospitals').select('*');
    if (query) {
      q = q.or(`name.ilike.%${query}%,address.ilike.%${query}%`);
    }
    const { data, error } = await q.order('name');
    if (error) throw error;
    return data ?? [];
  },
  nearest: async (lat: number, lng: number, limit = 10): Promise<Hospital[]> => {
    const { data, error } = await supabase.from('hospitals').select('*');
    if (error) throw error;
    return (data ?? [])
      .map((h: Hospital) => ({ ...h, distance_km: haversineKm(lat, lng, h.lat, h.lng) }))
      .sort((a: Hospital, b: Hospital) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
      .slice(0, limit);
  },
};

export const hospitalsService = Config.useMockData ? mockService : supabaseService;
