-- Verbindliche Einladung in Wellen (Nov. 2026)
-- Welle 1: Die ersten N „Ich bin dabei“-Antworten der Interessensabfrage bekommen einen reservierten Platz
-- (status 'angeboten' + Frist) und einen persönlichen Anmeldelink. Alle weiteren „dabei“ kommen in
-- Reihenfolge der Vormerkung auf die Warteliste. Läuft eine Frist ab oder sagt jemand ab, rückt der
-- Nächste automatisch nach (promote_next, Mail „platz_frei“, Frist offer_hours).

-- 1) Reservierte Plätze ohne Anmeldung zählen als belegt (vorher nur mit Anmeldung + Teilnahmeart)
create or replace function public.occupied_counts(p_event uuid)
returns table (participation_type text, taken int)
language sql stable as $$
  select r.participation_type, count(*)::int
  from public.event_guests g
  left join public.event_registrations r on r.guest_id = g.id
  where g.event_id = p_event
    and (g.status in ('angemeldet', 'bestaetigt', 'eingecheckt')
         or (g.status = 'angeboten' and g.offer_expires_at > now()))
  group by r.participation_type
$$;

-- 2) Anmeldung: Wer einen reservierten Platz hat (angeboten, Frist läuft), meldet sich direkt an –
--    ohne erneute Kapazitätsprüfung, der Platz ist ja schon für ihn gehalten.
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

  if v_requested not in ('own', 'taxi') then
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

-- 3) Nachrücken: auch Wartende ohne Anmeldung (aus der Vormerkung) bekommen einen Platz angeboten;
--    sie melden sich dann über ihren persönlichen Link an.
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
    select g.id, r.guest_id as reg, r.requested_type, r.second_choice
    from public.event_guests g left join public.event_registrations r on r.guest_id = g.id
    where g.event_id = p_event and g.status = 'warteliste'
    order by g.waitlist_position nulls last, g.updated_at
  loop
    if v_candidate.reg is null then
      v_type := null;                       -- noch keine Anmeldung: Teilnahmeart wählt der Gast im Formular
    elsif public.type_fits(p_event, v_candidate.requested_type) then
      v_type := v_candidate.requested_type;
    elsif v_candidate.second_choice is not null and public.type_fits(p_event, v_candidate.second_choice) then
      v_type := v_candidate.second_choice;
    else
      continue;
    end if;

    v_hours := case when v_event.registration_deadline is not null and now() > v_event.registration_deadline
                    then v_event.offer_hours_after_deadline else v_event.offer_hours end;

    if v_candidate.reg is not null then
      update public.event_registrations set participation_type = v_type where guest_id = v_candidate.id;
    end if;
    update public.event_guests set status = 'angeboten', offer_expires_at = now() + make_interval(hours => v_hours)
      where id = v_candidate.id;

    insert into public.email_queue (event_id, guest_id, to_email, type, priority)
      select p_event, g.id, g.email, 'platz_frei', 1 from public.event_guests g where g.id = v_candidate.id;

    return v_candidate.id;
  end loop;
  return null;
end $$;

-- 4) Welle starten: reserviert Plätze für die ersten „dabei“-Antworten, setzt den Rest auf die Warteliste
--    und legt die Einladungsmails in die Warteschlange. Wird erst auf Knopfdruck im Admin ausgeführt.
create or replace function public.start_invite_wave(p_event uuid, p_deadline timestamptz, p_offer_hours int default 72)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_free int;
  v_pos int;
  v_reserved int := 0;
  v_waiting int := 0;
  v_row record;
begin
  perform 1 from public.events where id = p_event for update;
  if p_deadline <= now() then
    return jsonb_build_object('result', 'deadline_past');
  end if;
  update public.events set offer_hours = p_offer_hours where id = p_event;
  v_free := greatest((public.free_slots(p_event) ->> 'free')::int, 0);
  select coalesce(max(waitlist_position), 0) into v_pos from public.event_guests where event_id = p_event;

  for v_row in
    select g.id
    from public.event_interest i join public.event_guests g on g.id = i.guest_id
    where i.event_id = p_event and i.answer = 'dabei' and g.status = 'eingeladen' and not g.bounced
    order by i.created_at, g.id
  loop
    if v_reserved < v_free then
      update public.event_guests set status = 'angeboten', offer_expires_at = p_deadline, waitlist_position = null where id = v_row.id;
      insert into public.email_queue (event_id, guest_id, to_email, type, priority)
        select p_event, g.id, g.email, 'einladung', 1 from public.event_guests g where g.id = v_row.id;
      v_reserved := v_reserved + 1;
    else
      v_pos := v_pos + 1;
      update public.event_guests set status = 'warteliste', waitlist_position = v_pos where id = v_row.id;
      v_waiting := v_waiting + 1;
    end if;
  end loop;

  return jsonb_build_object('result', 'ok', 'reserved', v_reserved, 'waitlist', v_waiting);
end $$;

revoke all on function public.start_invite_wave(uuid, timestamptz, int) from public, anon, authenticated;
grant execute on function public.start_invite_wave(uuid, timestamptz, int) to service_role;
grant execute on function public.occupied_counts(uuid) to service_role;
grant execute on function public.register_guest(text, jsonb) to service_role;
grant execute on function public.promote_next(uuid) to service_role;
