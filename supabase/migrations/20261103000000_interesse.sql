-- Unverbindliche Interessensabfrage vor der verbindlichen Einladung (Save the Date, Nov. 2026)
-- Eine Antwort je Gast, jederzeit über den persönlichen Link änderbar.

create table if not exists public.event_interest (
  guest_id      uuid primary key references public.event_guests (id) on delete cascade,
  event_id      uuid not null references public.events (id) on delete cascade,
  answer        text not null check (answer in ('dabei', 'interessiert', 'nicht')),
  mode          text not null default '' check (mode in ('', 'own', 'taxi', 'offen')),
  vehicle       text not null default '',
  note          text not null default '',
  contact_email text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists event_interest_event_answer_idx on public.event_interest (event_id, answer);

drop trigger if exists event_interest_touch on public.event_interest;
create trigger event_interest_touch before update on public.event_interest
  for each row execute function public.touch_updated_at();

alter table public.event_interest enable row level security;
revoke all on public.event_interest from anon, authenticated;
grant select, insert, update, delete on public.event_interest to service_role;
