-- Teilnahmearten neu (16.11.2026): eigener Wagen (own), Drift-Beifahrer (interner Schlüssel weiterhin 'taxi'),
-- nur zum Dinner (dinner). Renntaxi gibt es nicht mehr; 'taxi' wird als „Drift-Beifahrer“ angezeigt.

alter table public.event_capacity drop constraint if exists event_capacity_participation_type_check;
alter table public.event_capacity add constraint event_capacity_participation_type_check check (participation_type in ('own', 'taxi', 'lambo', 'dinner'));
alter table public.event_registrations drop constraint if exists event_registrations_requested_type_check;
alter table public.event_registrations add constraint event_registrations_requested_type_check check (requested_type in ('own', 'taxi', 'lambo', 'dinner'));
alter table public.event_registrations drop constraint if exists event_registrations_participation_type_check;
alter table public.event_registrations add constraint event_registrations_participation_type_check check (participation_type in ('own', 'taxi', 'lambo', 'dinner'));
alter table public.event_registrations drop constraint if exists event_registrations_second_choice_check;
alter table public.event_registrations add constraint event_registrations_second_choice_check check (second_choice in ('own', 'taxi', 'lambo', 'dinner'));
alter table public.event_interest drop constraint if exists event_interest_mode_check;
alter table public.event_interest add constraint event_interest_mode_check check (mode in ('', 'own', 'taxi', 'dinner', 'offen'));

insert into public.event_capacity (event_id, participation_type, max_slots)
  select id, 'dinner', null from public.events
  where not exists (select 1 from public.event_capacity c where c.event_id = events.id and c.participation_type = 'dinner');

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
  foreach v_type in array array['own', 'taxi', 'dinner'] loop
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
  v_reserved boolean;
begin
  select event_id into v_eid from public.event_guests where code = upper(trim(p_code));
  if not found then
    return jsonb_build_object('result', 'invalid');
  end if;

  select * into v_event from public.events where id = v_eid for update;
  perform public.expire_offers(v_event.id);
  select * into v_guest from public.event_guests where code = upper(trim(p_code)) for update;

  v_reserved := v_guest.status = 'angeboten' and v_guest.offer_expires_at > now()
    and not exists (select 1 from public.event_registrations where guest_id = v_guest.id);

  if not v_reserved and v_guest.status in ('angemeldet', 'bestaetigt', 'eingecheckt', 'warteliste', 'angeboten') then
    return jsonb_build_object('result', 'already', 'manage_token', v_guest.manage_token, 'status', v_guest.status);
  end if;

  if v_event.status <> 'aktiv' or (not v_reserved and v_event.registration_deadline is not null and now() > v_event.registration_deadline) then
    return jsonb_build_object('result', 'closed');
  end if;

  if v_requested not in ('own', 'taxi', 'dinner') then
    return jsonb_build_object('result', 'invalid_type');
  end if;

  if v_reserved then
    v_type := v_requested;
  elsif public.type_fits(v_event.id, v_requested) then
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


grant execute on function public.free_slots(uuid) to service_role;
grant execute on function public.register_guest(text, jsonb) to service_role;
