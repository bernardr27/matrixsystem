-- Performance index suggestions for Matrix runtime paths

create index if not exists idx_ghost_bridge_status_created_at on ghost_bridge (status, created_at desc);
create index if not exists idx_ghost_bridge_command_created_at on ghost_bridge (command, created_at desc);
create index if not exists idx_system_events_event_type_timestamp on system_events (event_type, timestamp desc);
create index if not exists idx_system_events_source_timestamp on system_events (source, timestamp desc);
