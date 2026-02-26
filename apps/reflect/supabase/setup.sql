-- Reflect App Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Personalization fields
alter table public.profiles
  add column if not exists default_mode text
    check (default_mode in ('mindset','career','money','relationships','discipline'))
    default 'mindset';
alter table public.profiles
  add column if not exists daily_prompt boolean default false;

alter table public.profiles enable row level security;

create policy "Users can view own profile" 
on public.profiles for select 
using ( auth.uid() = id );

create policy "Users can update own profile" 
on public.profiles for update 
using ( auth.uid() = id );

-- 2. Sessions Table
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Mode Enum (Store as text for simplicity, or create a custom type)
  mode text check (mode in ('mindset', 'career', 'money', 'relationships', 'discipline')) not null,
  
  -- Reflection Content
  initial_input text not null,
  mirror_text text not null,
  pattern_text text not null,
  reframe_question text not null,
  user_resolution text, -- Null until answered
  
  completed_at timestamp with time zone -- Null until answered
);

alter table public.sessions enable row level security;

create policy "Users can view own sessions" 
on public.sessions for select 
using ( auth.uid() = user_id );

create policy "Users can insert own sessions" 
on public.sessions for insert 
with check ( auth.uid() = user_id );

create policy "Users can update own sessions" 
on public.sessions for update 
using ( auth.uid() = user_id );

-- 3. Patterns Table (Power Feature)
create table public.patterns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  keyword_or_theme text not null,
  frequency integer default 1,
  last_detected timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.patterns enable row level security;

create policy "Users can view own patterns" 
on public.patterns for select 
using ( auth.uid() = user_id );

-- 5. Embeddings (Vector Memory)
-- Enable the extension if available
create extension if not exists vector;

create table public.session_embeddings (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  embedding vector(1536), -- OpenAI / Ollama dimension
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.session_embeddings enable row level security;

create policy "Users can view own embeddings" 
on public.session_embeddings for select 
using ( auth.uid() = user_id );

-- 6. Course Progress
create table public.course_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  course_id text not null,
  completed_days integer[] default '{}',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id)
);

alter table public.course_progress enable row level security;

create policy "Users can view and update own progress" 
on public.course_progress for all 
using ( auth.uid() = user_id );

-- 4. Triggers (Optional: Auto-create profile on signup)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
