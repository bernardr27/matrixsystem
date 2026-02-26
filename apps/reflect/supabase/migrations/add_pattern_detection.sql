-- Migration: Update Patterns Table Schema
-- This adds the new columns needed for cognitive distortion detection

-- Add new columns to patterns table if they don't exist
alter table public.patterns
  add column if not exists session_id uuid references public.sessions(id) on delete cascade,
  add column if not exists pattern_type text,
  add column if not exists pattern_name text,
  add column if not exists confidence numeric default 0.5,
  add column if not exists evidence text[],
  add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- Create index for faster queries
create index if not exists idx_patterns_user_id on public.patterns(user_id);
create index if not exists idx_patterns_session_id on public.patterns(session_id);
create index if not exists idx_patterns_type on public.patterns(pattern_type);
