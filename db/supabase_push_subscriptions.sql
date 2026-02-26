-- Push Subscriptions table for Web Push notifications
create table if not exists push_subscriptions (
    id bigserial primary key,
    user_id uuid references auth.users not null unique,
    endpoint text not null,
    keys jsonb not null, -- { p256dh, auth }
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table push_subscriptions enable row level security;

create policy "Users can manage their own push subscriptions"
on push_subscriptions for all
using ( auth.uid() = user_id )
with check ( auth.uid() = user_id );
