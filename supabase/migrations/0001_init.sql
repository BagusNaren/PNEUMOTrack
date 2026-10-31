-- PNEUMOTrack initial schema (contract v2)
-- Apply with: supabase db push  (or psql "$DB_URL" -f supabase/migrations/0001_init.sql)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  birth_date date not null check (birth_date <= current_date),
  sex text not null check (sex in ('male', 'female')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists children_parent_idx on public.children(parent_id);

alter table public.children enable row level security;

drop policy if exists "children_owner_all" on public.children;
create policy "children_owner_all" on public.children
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());

-- ---------------------------------------------------------------------------
-- screenings
-- ---------------------------------------------------------------------------
create table if not exists public.screenings (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  result text not null check (result in ('normal', 'risk')),
  agreement boolean not null,
  ae_error double precision,
  ae_threshold double precision,
  ocsvm_score double precision,
  chunks integer check (chunks >= 0),
  duration_sec double precision check (duration_sec >= 0),
  waveform jsonb,
  summary text,
  model_version text not null default 'v3',
  created_at timestamptz not null default now()
);

create index if not exists screenings_child_created_idx
  on public.screenings(child_id, created_at desc);

alter table public.screenings enable row level security;

drop policy if exists "screenings_owner_select" on public.screenings;
create policy "screenings_owner_select" on public.screenings
  for select using (
    exists (
      select 1 from public.children c
      where c.id = screenings.child_id and c.parent_id = auth.uid()
    )
  );

drop policy if exists "screenings_owner_insert" on public.screenings;
-- Requires an authenticated user whose auth.uid() matches children.parent_id for child_id.
-- Client sessions without login or using a preview child profile skip inserting into screenings.
create policy "screenings_owner_insert" on public.screenings
  for insert with check (
    exists (
      select 1 from public.children c
      where c.id = screenings.child_id and c.parent_id = auth.uid()
    )
  );

drop policy if exists "screenings_owner_delete" on public.screenings;
create policy "screenings_owner_delete" on public.screenings
  for delete using (
    exists (
      select 1 from public.children c
      where c.id = screenings.child_id and c.parent_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- hospitals (public read)
-- ---------------------------------------------------------------------------
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  phone text,
  type text not null check (type in ('hospital', 'puskesmas', 'clinic')),
  has_pediatric boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.hospitals enable row level security;

drop policy if exists "hospitals_public_read" on public.hospitals;
create policy "hospitals_public_read" on public.hospitals
  for select using (true);

-- ---------------------------------------------------------------------------
-- doctors (public read)
-- ---------------------------------------------------------------------------
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null,
  hospital_id uuid references public.hospitals(id) on delete set null,
  photo_url text,
  phone text,
  whatsapp text,
  bio text,
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  schedule jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists doctors_hospital_idx on public.doctors(hospital_id);

alter table public.doctors enable row level security;

drop policy if exists "doctors_public_read" on public.doctors;
create policy "doctors_public_read" on public.doctors
  for select using (true);

-- ---------------------------------------------------------------------------
-- articles (public read)
-- ---------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('gejala', 'pencegahan', 'penanganan', 'edukasi')),
  cover_url text,
  body_md text not null,
  source text not null,
  published_at timestamptz not null default now()
);

alter table public.articles enable row level security;

drop policy if exists "articles_public_read" on public.articles;
create policy "articles_public_read" on public.articles
  for select using (true);

-- ---------------------------------------------------------------------------
-- chat (P2 — schema ready, UI optional)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_id, doctor_id)
);

alter table public.conversations enable row level security;

drop policy if exists "conversations_owner_all" on public.conversations;
create policy "conversations_owner_all" on public.conversations
  for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('parent', 'doctor')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx
  on public.messages(conversation_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "messages_owner_all" on public.messages;
create policy "messages_owner_all" on public.messages
  for all using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.parent_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.parent_id = auth.uid()
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- triggers
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists children_set_updated_at on public.children;
create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();
