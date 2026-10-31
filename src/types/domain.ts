// src/types/domain.ts
// Domain types matching the Supabase schema (§4.2) — kept in sync with supabase/migrations/0001_init.sql

export type Sex = 'male' | 'female';

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  birth_date: string; // ISO date string, e.g. "2023-03-15"
  sex: Sex;
  created_at: string;
}

export interface Screening {
  id: string;
  child_id: string;
  result: 'risk' | 'normal';
  agreement: boolean;
  ae_error: number | null;
  ae_threshold: number | null;
  ocsvm_score: number | null;
  chunks: number | null;
  duration_sec: number | null;
  waveform: number[] | null;
  summary: string | null;
  model_version: string | null;
  created_at: string;
}

export interface DoctorSchedule {
  day: string; // "Senin" | "Selasa" | ...
  time: string; // "08:00 - 14:00"
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital_id: string | null;
  hospital_name: string | null;
  photo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  bio: string | null;
  rating: number | null;
  schedule: DoctorSchedule[] | null;
}

export type HospitalType = 'RS' | 'Puskesmas' | 'Klinik';

export interface Hospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  type: HospitalType;
  has_pediatric: boolean;
  distance_km?: number; // computed client-side
}

export type ArticleCategory = 'Gejala' | 'Pencegahan' | 'Penanganan' | 'Edukasi';

export interface Article {
  id: string;
  title: string;
  category: ArticleCategory;
  cover_url: string | null;
  body_md: string;
  source: string | null;
  published_at: string;
}

export interface Conversation {
  id: string;
  doctor_id: string;
  parent_id: string;
  doctor?: Doctor;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'parent' | 'doctor';
  content: string;
  created_at: string;
}
