// src/services/children/index.ts
// Children service — mock and Supabase implementations.

import { Config } from '@/constants/config';
import { supabase } from '@/services/supabase/client';
import type { Child, Sex } from '@/types/domain';
import { MOCK_CHILDREN } from '../mock-data';

export interface CreateChildInput {
  name: string;
  birth_date: string;
  sex: Sex;
}

export interface UpdateChildInput extends Partial<CreateChildInput> {}

// Mock implementation
const mockService = {
  list: async (_parentId: string): Promise<Child[]> => {
    await new Promise((r) => setTimeout(r, 300));
    return [...MOCK_CHILDREN];
  },
  get: async (id: string): Promise<Child | null> => {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_CHILDREN.find((c) => c.id === id) ?? null;
  },
  create: async (parentId: string, input: CreateChildInput): Promise<Child> => {
    await new Promise((r) => setTimeout(r, 400));
    const child: Child = {
      id: `child-${Date.now()}`,
      parent_id: parentId,
      ...input,
      created_at: new Date().toISOString(),
    };
    MOCK_CHILDREN.push(child);
    return child;
  },
  update: async (id: string, input: UpdateChildInput): Promise<Child> => {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_CHILDREN.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Child not found');
    MOCK_CHILDREN[idx] = { ...MOCK_CHILDREN[idx], ...input };
    return MOCK_CHILDREN[idx];
  },
  remove: async (id: string): Promise<void> => {
    await new Promise((r) => setTimeout(r, 300));
    const idx = MOCK_CHILDREN.findIndex((c) => c.id === id);
    if (idx >= 0) MOCK_CHILDREN.splice(idx, 1);
  },
};

// Supabase implementation
const supabaseService = {
  list: async (parentId: string): Promise<Child[]> => {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  get: async (id: string): Promise<Child | null> => {
    const { data, error } = await supabase.from('children').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },
  create: async (parentId: string, input: CreateChildInput): Promise<Child> => {
    const { data, error } = await supabase
      .from('children')
      .insert({ parent_id: parentId, ...input })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, input: UpdateChildInput): Promise<Child> => {
    const { data, error } = await supabase
      .from('children')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from('children').delete().eq('id', id);
    if (error) throw error;
  },
};

export const childrenService = Config.useMockData ? mockService : supabaseService;
