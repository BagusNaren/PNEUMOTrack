// src/services/doctors/index.ts
// Doctors service — read-only from Supabase, no RLS restriction needed (public data).

import { Config } from '@/constants/config';
import { supabase } from '@/services/supabase/client';
import type { Doctor } from '@/types/domain';
import { MOCK_DOCTORS } from '../mock-data';

export interface DoctorFilter {
  specialty?: string;
  query?: string;
}

export type DoctorFilterParam = DoctorFilter | string;

function normalizeFilter(filter?: DoctorFilterParam): DoctorFilter | undefined {
  if (!filter) return undefined;
  if (typeof filter === 'string') return { query: filter };
  return filter;
}

// Mock implementation
const mockService = {
  list: async (filterParam?: DoctorFilterParam): Promise<Doctor[]> => {
    const filter = normalizeFilter(filterParam);
    await new Promise((r) => setTimeout(r, 400));
    let results = [...MOCK_DOCTORS];
    if (filter?.specialty) {
      results = results.filter((d) => d.specialty.includes(filter.specialty!));
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          (d.hospital_name?.toLowerCase().includes(q) ?? false),
      );
    }
    return results;
  },
  get: async (id: string): Promise<Doctor | null> => {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_DOCTORS.find((d) => d.id === id) ?? null;
  },
};

// Supabase implementation
const supabaseService = {
  list: async (filterParam?: DoctorFilterParam): Promise<Doctor[]> => {
    const filter = normalizeFilter(filterParam);
    let query = supabase.from('doctors').select('*, hospitals(name)');
    if (filter?.query) {
      query = query.or(`name.ilike.%${filter.query}%,specialty.ilike.%${filter.query}%`);
    }
    if (filter?.specialty) {
      query = query.ilike('specialty', `%${filter.specialty}%`);
    }
    const { data, error } = await query.order('rating', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((d: any) => ({
      ...d,
      hospital_name: d.hospitals?.name ?? null,
    }));
  },
  get: async (id: string): Promise<Doctor | null> => {
    const { data, error } = await supabase
      .from('doctors')
      .select('*, hospitals(name)')
      .eq('id', id)
      .single();
    if (error) return null;
    return { ...data, hospital_name: (data as any).hospitals?.name ?? null };
  },
};

export const doctorsService = Config.useMockData ? mockService : supabaseService;
