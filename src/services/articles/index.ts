// src/services/articles/index.ts
// Articles service — read-only content from Supabase or mock.

import { Config } from "@/constants/config";
import { supabase } from "@/services/supabase/client";
import type { Article, ArticleCategory } from "@/types/domain";
import { MOCK_ARTICLES } from "../mock-data";

// Mock implementation
const mockService = {
  list: async (category?: ArticleCategory | "Semua"): Promise<Article[]> => {
    await new Promise((r) => setTimeout(r, 400));
    if (!category || category === "Semua") return [...MOCK_ARTICLES];
    return MOCK_ARTICLES.filter((a) => a.category === category);
  },
  get: async (id: string): Promise<Article | null> => {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_ARTICLES.find((a) => a.id === id) ?? null;
  },
};

// Supabase implementation
const supabaseService = {
  list: async (category?: ArticleCategory | "Semua"): Promise<Article[]> => {
    let query = supabase
      .from("articles")
      .select("*")
      .order("published_at", { ascending: false });
    if (category && category !== "Semua") {
      query = query.eq("category", category);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  get: async (id: string): Promise<Article | null> => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

export const articlesService = Config.useMockData
  ? mockService
  : supabaseService;
