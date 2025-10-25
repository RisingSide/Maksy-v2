create table if not exists public.webhook_events (
  id bigserial primary key,
  source text not null default 'stripe',
  event_id text not null,
  type text not null,
  received_at timestamptz not null default now(),
  status text not null default 'received',
  payload_json jsonb not null
);
create unique index if not exists webhook_events_source_event_id_key
  on public.webhook_events (source, event_id);
alter table public.webhook_events enable row level security;
drop policy if exists wh_select_all on public.webhook_events;
create policy wh_select_all on public.webhook_events for select using (auth.uid() is not null);
