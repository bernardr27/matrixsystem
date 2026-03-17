-- Matrix observability split tables
-- Apply in Supabase SQL editor or migration runner.

create table if not exists public.system_heartbeats (
    id uuid primary key default gen_random_uuid(),
    source text not null,
    status text not null default 'online',
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_system_heartbeats_source_created
    on public.system_heartbeats(source, created_at desc);

create table if not exists public.system_alerts (
    id uuid primary key default gen_random_uuid(),
    source text not null,
    severity text not null default 'info',
    title text not null,
    message text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_system_alerts_source_created
    on public.system_alerts(source, created_at desc);

create index if not exists idx_system_alerts_severity_created
    on public.system_alerts(severity, created_at desc);

create table if not exists public.process_launch_events (
    id uuid primary key default gen_random_uuid(),
    service text not null,
    kind text not null,
    command text null,
    args jsonb not null default '[]'::jsonb,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists idx_process_launch_events_service_created
    on public.process_launch_events(service, created_at desc);
