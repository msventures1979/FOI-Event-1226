-- FOI Event-Plattform – Grundschema
-- Alle Tabellen sind per RLS gesperrt; Zugriff ausschließlich serverseitig mit dem Service-Role-Key.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  starts_at timestamptz not null,
  location text not null,
  registration_deadline timestamptz,
  total_capacity int not null default 80 check (total_capacity > 0),
  offer_hours int not null default 48,
  offer_hours_after_deadline int not null default 24,
  status text not null default 'aktiv' check (status in ('entwurf', 'aktiv', 'geschlossen')),
  created_at timestamptz not null default now()
);

create table public.event_capacity (
  event_id uuid not null references public.events (id) on delete cascade,
  participation_type text not null check (participation_type in ('own', 'taxi', 'lambo')),
  max_slots int check (max_slots is null or max_slots >= 0), -- null = keine eigene Obergrenze
  primary key (event_id, participation_type)
);

-- ---------------------------------------------------------------------------
-- Gäste (Import je Event) und Anmeldungen
-- ---------------------------------------------------------------------------
create table public.event_guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  salutation text not null default '' check (salutation in ('Herr', 'Frau', '')),
  title text not null default '',
  first_name text not null,
  last_name text not null,
  email citext not null,
  company text not null default '',
  position text not null default '',
  note text not null default '',
  code text not null unique,
  manage_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  status text not null default 'eingeladen' check (
    status in ('eingeladen', 'angemeldet', 'bestaetigt', 'warteliste', 'angeboten', 'abgesagt', 'storniert', 'eingecheckt', 'verfallen')
  ),
  waitlist_position int,
  offer_expires_at timestamptz,
  bounced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);

create index event_guests_event_status_idx on public.event_guests (event_id, status);

create table public.event_registrations (
  guest_id uuid primary key references public.event_guests (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  requested_type text not null check (requested_type in ('own', 'taxi', 'lambo')),
  participation_type text check (participation_type in ('own', 'taxi', 'lambo')),
  second_choice text check (second_choice in ('own', 'taxi', 'lambo')),
  extra_ride boolean not null default false,
  mobile text not null default '',
  vehicle jsonb not null default '{}'::jsonb, -- marke, modell, baujahr, ps, kennzeichen, getriebe, reifen
  experience text not null default '',
  license_since text not null default '',
  height_cm text not null default '',
  diet text not null default '',
  allergies text not null default '',
  companion text not null default '',
  consent_photo boolean not null default false,
  consent_terms_at timestamptz,
  consent_waiver_at timestamptz,   -- Haftungsverzicht School of Racing
  consent_gohm_at timestamptz,     -- Nutzungsbedingungen Autohaus Gohm
  start_number int,
  confirmed_at timestamptz,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index event_registrations_start_number_uq on public.event_registrations (event_id, start_number);

-- ---------------------------------------------------------------------------
-- Mails
-- ---------------------------------------------------------------------------
create table public.email_queue (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  guest_id uuid references public.event_guests (id) on delete cascade,
  to_email citext not null,
  type text not null,
  priority int not null default 5, -- 1 = transaktional (sofort), 5 = Massenversand
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  attempts int not null default 0,
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create index email_queue_pending_idx on public.email_queue (priority, scheduled_for) where sent_at is null;

create table public.email_log (
  id bigint generated always as identity primary key,
  event_id uuid references public.events (id) on delete set null,
  guest_id uuid references public.event_guests (id) on delete set null,
  to_email citext not null,
  type text not null,
  resend_id text,
  status text not null default 'gesendet',
  error text,
  created_at timestamptz not null default now()
);

create index email_log_guest_type_idx on public.email_log (guest_id, type);

create table public.status_log (
  id bigint generated always as identity primary key,
  guest_id uuid references public.event_guests (id) on delete cascade,
  from_status text,
  to_status text,
  actor text not null default 'system',
  created_at timestamptz not null default now()
);

create table public.admin_users (
  email citext primary key,
  created_at timestamptz not null default now()
);

-- RLS: alles zu, Zugriff nur über Service Role
alter table public.events enable row level security;
alter table public.event_capacity enable row level security;
alter table public.event_guests enable row level security;
alter table public.event_registrations enable row level security;
alter table public.email_queue enable row level security;
alter table public.email_log enable row level security;
alter table public.status_log enable row level security;
alter table public.admin_users enable row level security;

-- ---------------------------------------------------------------------------
-- Hilfsfunktionen
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger event_guests_touch before update on public.event_guests
  for each row execute function public.touch_updated_at();
create trigger event_registrations_touch before update on public.event_registrations
  for each row execute function public.touch_updated_at();

create or replace function public.log_status_change() returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    insert into public.status_log (guest_id, from_status, to_status, actor)
    values (new.id, old.status, new.status, coalesce(current_setting('foi.actor', true), 'system'));
  end if;
  return new;
end $$;

create trigger event_guests_status_log after update on public.event_guests
  for each row execute function public.log_status_change();

-- Belegte Plätze: angemeldet, bestätigt, eingecheckt sowie offene Nachrück-Angebote
create or replace function public.occupied_counts(p_event uuid)
returns table (participation_type text, taken int)
language sql stable as $$
  select r.participation_type, count(*)::int
  from public.event_guests g
  join public.event_registrations r on r.guest_id = g.id
  where g.event_id = p_event
    and r.participation_type is not null
    and (g.status in ('angemeldet', 'bestaetigt', 'eingecheckt')
         or (g.status = 'angeboten' and g.offer_expires_at > now()))
  group by r.participation_type
$$;

create or replace function public.free_slots(p_event uuid)
returns jsonb language plpgsql stable as $$
declare
  v_total int;
  v_taken int;
  v_result jsonb := '{}'::jsonb;
  v_type text;
  v_max int;
  v_type_taken int;
begin
  select total_capacity into v_total from public.events where id = p_event;
  select coalesce(sum(taken), 0) into v_taken from public.occupied_counts(p_event);
  v_result := jsonb_build_object('total', v_total, 'taken', v_taken, 'free', greatest(v_total - v_taken, 0));
  foreach v_type in array array['own', 'taxi', 'lambo'] loop
    select max_slots into v_max from public.event_capacity where event_id = p_event and participation_type = v_type;
    select coalesce(taken, 0) into v_type_taken from public.occupied_counts(p_event) where participation_type = v_type;
    v_type_taken := coalesce(v_type_taken, 0);
    v_result := v_result || jsonb_build_object(v_type, jsonb_build_object(
      'max', v_max,
      'taken', v_type_taken,
      'free', case when v_max is null then greatest(v_total - v_taken, 0)
                   else least(greatest(v_max - v_type_taken, 0), greatest(v_total - v_taken, 0)) end
    ));
  end loop;
  return v_result;
end $$;

create or replace function public.type_fits(p_event uuid, p_type text)
returns boolean language plpgsql stable as $$
declare
  v_slots jsonb := public.free_slots(p_event);
begin
  if p_type is null then return false; end if;
  return (v_slots -> p_type ->> 'free')::int > 0;
end $$;

-- ---------------------------------------------------------------------------
-- Anmeldung (atomar: sperrt die Event-Zeile, damit nie überbucht wird)
-- ---------------------------------------------------------------------------
create or replace function public.register_guest(p_code text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_guest public.event_guests;
  v_event public.events;
  v_requested text := p_data ->> 'participation_type';
  v_second text := nullif(p_data ->> 'second_choice', '');
  v_type text;
  v_status text;
  v_pos int;
  v_start int;
  v_eid uuid;
begin
  select event_id into v_eid from public.event_guests where code = upper(trim(p_code));
  if not found then
    return jsonb_build_object('result', 'invalid');
  end if;

  -- erst das Event sperren, dann den Gast frisch lesen (parallele Anmeldungen mit demselben Code)
  select * into v_event from public.events where id = v_eid for update;
  perform public.expire_offers(v_event.id);
  select * into v_guest from public.event_guests where code = upper(trim(p_code)) for update;

  if v_guest.status in ('angemeldet', 'bestaetigt', 'eingecheckt', 'warteliste', 'angeboten') then
    return jsonb_build_object('result', 'already', 'manage_token', v_guest.manage_token, 'status', v_guest.status);
  end if;

  if v_event.status <> 'aktiv' or (v_event.registration_deadline is not null and now() > v_event.registration_deadline) then
    return jsonb_build_object('result', 'closed');
  end if;

  if v_requested not in ('own', 'taxi', 'lambo') then
    return jsonb_build_object('result', 'invalid_type');
  end if;

  if public.type_fits(v_event.id, v_requested) then
    v_type := v_requested;
  elsif v_second is not null and v_second <> v_requested and public.type_fits(v_event.id, v_second) then
    v_type := v_second;
  else
    v_type := null;
  end if;

  if v_type is not null then
    v_status := 'angemeldet';
    select coalesce(max(start_number), 0) + 1 into v_start from public.event_registrations where event_id = v_event.id;
  else
    v_status := 'warteliste';
    select coalesce(max(waitlist_position), 0) + 1 into v_pos from public.event_guests where event_id = v_event.id;
  end if;

  -- Stammdaten aktualisieren
  update public.event_guests set
    salutation = coalesce(nullif(p_data ->> 'salutation', ''), salutation),
    title = coalesce(p_data ->> 'title', title),
    first_name = coalesce(nullif(p_data ->> 'first_name', ''), first_name),
    last_name = coalesce(nullif(p_data ->> 'last_name', ''), last_name),
    email = coalesce(nullif(p_data ->> 'email', ''), email::text),
    company = coalesce(p_data ->> 'company', company),
    position = coalesce(p_data ->> 'position', position),
    status = v_status,
    waitlist_position = case when v_status = 'warteliste' then v_pos else null end,
    offer_expires_at = null
  where id = v_guest.id;

  insert into public.event_registrations (
    guest_id, event_id, requested_type, participation_type, second_choice, extra_ride, mobile, vehicle,
    experience, license_since, height_cm, diet, allergies, companion, consent_photo,
    consent_terms_at, consent_waiver_at, consent_gohm_at, start_number
  ) values (
    v_guest.id, v_event.id, v_requested, v_type, v_second,
    coalesce((p_data ->> 'extra_ride')::boolean, false),
    coalesce(p_data ->> 'mobile', ''),
    coalesce(p_data -> 'vehicle', '{}'::jsonb),
    coalesce(p_data ->> 'experience', ''),
    coalesce(p_data ->> 'license_since', ''),
    coalesce(p_data ->> 'height_cm', ''),
    coalesce(p_data ->> 'diet', ''),
    coalesce(p_data ->> 'allergies', ''),
    coalesce(p_data ->> 'companion', ''),
    coalesce((p_data ->> 'consent_photo')::boolean, false),
    case when coalesce((p_data ->> 'consent_terms')::boolean, false) then now() end,
    case when coalesce((p_data ->> 'consent_waiver')::boolean, false) then now() end,
    case when coalesce((p_data ->> 'consent_gohm')::boolean, false) then now() end,
    v_start
  )
  on conflict (guest_id) do update set
    requested_type = excluded.requested_type,
    participation_type = excluded.participation_type,
    second_choice = excluded.second_choice,
    extra_ride = excluded.extra_ride,
    mobile = excluded.mobile,
    vehicle = excluded.vehicle,
    experience = excluded.experience,
    license_since = excluded.license_since,
    height_cm = excluded.height_cm,
    diet = excluded.diet,
    allergies = excluded.allergies,
    companion = excluded.companion,
    consent_photo = excluded.consent_photo,
    consent_terms_at = excluded.consent_terms_at,
    consent_waiver_at = excluded.consent_waiver_at,
    consent_gohm_at = excluded.consent_gohm_at,
    start_number = coalesce(public.event_registrations.start_number, excluded.start_number);

  return jsonb_build_object(
    'result', v_status,
    'guest_id', v_guest.id,
    'participation_type', v_type,
    'manage_token', v_guest.manage_token,
    'waitlist_position', v_pos
  );
end $$;

-- ---------------------------------------------------------------------------
-- Nachrücken: bietet den nächsten passenden Wartelistenplatz an
-- ---------------------------------------------------------------------------
create or replace function public.promote_next(p_event uuid)
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare
  v_event public.events;
  v_candidate record;
  v_type text;
  v_hours int;
begin
  select * into v_event from public.events where id = p_event for update;
  if ((public.free_slots(p_event) ->> 'free')::int) <= 0 then
    return null;
  end if;

  for v_candidate in
    select g.id, r.requested_type, r.second_choice
    from public.event_guests g join public.event_registrations r on r.guest_id = g.id
    where g.event_id = p_event and g.status = 'warteliste'
    order by g.waitlist_position nulls last, g.updated_at
  loop
    if public.type_fits(p_event, v_candidate.requested_type) then
      v_type := v_candidate.requested_type;
    elsif v_candidate.second_choice is not null and public.type_fits(p_event, v_candidate.second_choice) then
      v_type := v_candidate.second_choice;
    else
      continue;
    end if;

    v_hours := case when v_event.registration_deadline is not null and now() > v_event.registration_deadline
                    then v_event.offer_hours_after_deadline else v_event.offer_hours end;

    update public.event_registrations set participation_type = v_type where guest_id = v_candidate.id;
    update public.event_guests set status = 'angeboten', offer_expires_at = now() + make_interval(hours => v_hours)
      where id = v_candidate.id;

    insert into public.email_queue (event_id, guest_id, to_email, type, priority)
      select p_event, g.id, g.email, 'platz_frei', 1 from public.event_guests g where g.id = v_candidate.id;

    return v_candidate.id;
  end loop;
  return null;
end $$;

-- Angebot annehmen
create or replace function public.accept_offer(p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_guest public.event_guests;
  v_start int;
  v_eid uuid;
begin
  select event_id into v_eid from public.event_guests where manage_token = p_token;
  if not found then return jsonb_build_object('result', 'invalid'); end if;
  perform 1 from public.events where id = v_eid for update;
  select * into v_guest from public.event_guests where manage_token = p_token for update;
  if v_guest.status <> 'angeboten' then return jsonb_build_object('result', 'not_offered', 'status', v_guest.status); end if;
  if v_guest.offer_expires_at < now() then return jsonb_build_object('result', 'expired'); end if;

  select coalesce(max(start_number), 0) + 1 into v_start from public.event_registrations where event_id = v_guest.event_id;
  update public.event_registrations set start_number = coalesce(start_number, v_start) where guest_id = v_guest.id;
  update public.event_guests set status = 'angemeldet', offer_expires_at = null, waitlist_position = null where id = v_guest.id;
  return jsonb_build_object('result', 'angemeldet', 'guest_id', v_guest.id);
end $$;

-- Absage (per Code aus der Einladung oder per Verwaltungs-Token)
create or replace function public.decline_guest(p_code text default null, p_token text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_guest public.event_guests;
  v_was_occupying boolean;
  v_new_status text;
  v_eid uuid;
begin
  select event_id into v_eid from public.event_guests
    where (p_token is not null and manage_token = p_token) or (p_token is null and code = upper(trim(p_code)));
  if not found then return jsonb_build_object('result', 'invalid'); end if;

  perform 1 from public.events where id = v_eid for update;
  perform public.expire_offers(v_eid);
  select * into v_guest from public.event_guests
    where (p_token is not null and manage_token = p_token) or (p_token is null and code = upper(trim(p_code)))
    for update;

  if v_guest.status in ('abgesagt', 'storniert') then
    return jsonb_build_object('result', 'already', 'guest_id', v_guest.id);
  end if;
  if v_guest.status in ('eingecheckt', 'verfallen') then
    return jsonb_build_object('result', 'not_allowed', 'guest_id', v_guest.id, 'status', v_guest.status);
  end if;

  v_was_occupying := v_guest.status in ('angemeldet', 'bestaetigt', 'angeboten');
  v_new_status := case when v_guest.status in ('angemeldet', 'bestaetigt') then 'storniert' else 'abgesagt' end;

  update public.event_guests set status = v_new_status, offer_expires_at = null, waitlist_position = null
    where id = v_guest.id;

  if v_was_occupying then
    perform public.promote_next(v_guest.event_id);
  end if;

  return jsonb_build_object('result', v_new_status, 'guest_id', v_guest.id);
end $$;

-- Abgelaufene Angebote freigeben und den Nächsten fragen
create or replace function public.expire_offers(p_event uuid)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare
  v_count int := 0;
begin
  perform 1 from public.events where id = p_event for update;
  update public.event_guests set status = 'verfallen', offer_expires_at = null
    where event_id = p_event and status = 'angeboten' and offer_expires_at < now();
  get diagnostics v_count = row_count;
  -- so viele Nachrücker fragen, wie Plätze frei sind (promote_next liefert null, wenn nichts passt)
  if v_count > 0 then
    for i in 1..greatest((public.free_slots(p_event) ->> 'free')::int, 0) loop
      exit when public.promote_next(p_event) is null;
    end loop;
  end if;
  return v_count;
end $$;

-- Mail-Jobs reservieren, damit parallele Läufe (Cron, Button, Sofortversand) nie doppelt senden
create or replace function public.claim_mail_jobs(p_max int, p_guest uuid default null)
returns setof public.email_queue language sql security definer set search_path = public, extensions as $$
  update public.email_queue q set locked_at = now()
  where q.id in (
    select id from public.email_queue
    where sent_at is null and attempts < 5 and scheduled_for <= now()
      and (locked_at is null or locked_at < now() - interval '10 minutes')
      and (p_guest is null or guest_id = p_guest)
    order by priority, scheduled_for
    limit p_max
    for update skip locked
  )
  returning q.*;
$$;

-- Funktionen nur für den Service-Role-Key
revoke all on function public.register_guest(text, jsonb) from public, anon, authenticated;
revoke all on function public.promote_next(uuid) from public, anon, authenticated;
revoke all on function public.accept_offer(text) from public, anon, authenticated;
revoke all on function public.decline_guest(text, text) from public, anon, authenticated;
revoke all on function public.expire_offers(uuid) from public, anon, authenticated;
revoke all on function public.free_slots(uuid) from public, anon, authenticated;
revoke all on function public.occupied_counts(uuid) from public, anon, authenticated;
revoke all on function public.type_fits(uuid, text) from public, anon, authenticated;
revoke all on function public.claim_mail_jobs(int, uuid) from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.log_status_change() from public, anon, authenticated;

-- Tabellen: kein Zugriff für anon/authenticated, voller Zugriff für den Service-Role-Key
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ---------------------------------------------------------------------------
-- Startdaten: FOI Racing 2026
-- ---------------------------------------------------------------------------
insert into public.events (slug, name, starts_at, location, registration_deadline, total_capacity)
values ('racing-2026', 'FOI Racing – Die Weihnachtsfeier der anderen Art',
        '2026-12-14 13:00:00+01', 'Hockenheimring', '2026-11-30 23:59:00+01', 80);

insert into public.event_capacity (event_id, participation_type, max_slots)
select id, t, null from public.events, unnest(array['own', 'taxi', 'lambo']) as t where slug = 'racing-2026';
