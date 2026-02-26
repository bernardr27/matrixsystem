-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create the episodic_memory table
create table if not exists episodic_memory (
    id bigserial primary key,
    user_id uuid references auth.users not null, -- Links to the Matrix SSO identity
    content text not null, -- The raw text/message content
    metadata jsonb, -- App source, UI state, roles, etc.
    embedding vector(1536), -- 1536 is the dimension size for OpenAI's text-embedding-3-small
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table episodic_memory enable row level security;

-- Policy to allow authenticated users to view their own memory
create policy "Users can view their own episodic memory" 
on episodic_memory for select 
using ( auth.uid() = user_id );

-- Policy to allow authenticated users to insert their own memory
create policy "Users can insert their own episodic memory" 
on episodic_memory for insert 
with check ( auth.uid() = user_id );

-- Create a generic function to perform Semantic Search via Cosine Similarity
-- You can call this from the Supabase client via `.rpc('match_episodes')`
create or replace function match_episodes (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_identifier uuid
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id,
    content,
    metadata,
    1 - (episodic_memory.embedding <=> query_embedding) as similarity
  from episodic_memory
  where user_id = user_identifier
    and 1 - (episodic_memory.embedding <=> query_embedding) > match_threshold
  order by episodic_memory.embedding <=> query_embedding
  limit match_count;
$$;
