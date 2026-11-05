-- LinkedIn-Profil je Gast
alter table public.event_guests add column if not exists linkedin text not null default '';
