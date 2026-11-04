-- Interessensabfrage: Gruppe auf der Strecke (nur bei eigenem Fahrzeug)
alter table public.event_interest
  add column if not exists track_group text not null default ''
  check (track_group in ('', 'rookie', 'performance', 'race'));
