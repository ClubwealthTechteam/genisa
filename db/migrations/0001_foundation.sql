-- GenISA foundation schema.
--
-- Everything lives in its own "genisa" schema, so Supabase's public data API
-- (which exposes the "public" schema to the browser key) never sees it. Row level
-- security is also switched on with no policies, so even if the schema were
-- exposed, the browser roles could read nothing. Only the app's server, which
-- connects as the database owner, reads and writes these tables.

create schema if not exists genisa;

-- Where a contact came from. Seeded with the sources we know about today.
create table genisa.sources (
  code        text primary key check (code ~ '^[a-z0-9_]+$'),
  name        text not null
);

insert into genisa.sources (code, name) values
  ('keap',            'Keap / IFS export'),
  ('courted',         'Courted.io'),
  ('model_match',     'Model Match'),
  ('drbill',          'DrBill'),
  ('web_scrape_2024', 'Website scrapes (2024)'),
  ('reality',         'REality'),
  ('ai2026',          'AI2026'),
  ('ai_research',     'GenISA AI research'),
  ('other',           'Other');

-- One row per uploaded file. The file itself is kept in storage at storage_path.
create table genisa.uploads (
  id               bigint generated always as identity primary key,
  source_code      text not null references genisa.sources (code),
  file_name        text not null,
  storage_path     text,
  detected_format  text,
  row_count        integer check (row_count >= 0),
  status           text not null default 'received'
                   check (status in ('received', 'processing', 'processed', 'failed')),
  error            text,
  uploaded_by      text not null,
  uploaded_at      timestamptz not null default now()
);

-- One row per person. Duplicates are merged into a single contact.
create table genisa.contacts (
  id               bigint generated always as identity primary key,
  first_name       text,
  last_name        text,
  company          text,
  -- 10-digit North American number, digits only, e.g. 6023348887.
  phone            text check (phone ~ '^[2-9][0-9]{2}[2-9][0-9]{6}$'),
  email            text check (email = lower(email)),
  address1         text,
  city             text,
  state            text check (state ~ '^[A-Z]{2}$'),
  zip              text check (zip ~ '^[0-9]{5}$'),
  latitude         double precision check (latitude between -90 and 90),
  longitude        double precision check (longitude between -180 and 180),
  -- How the location above was found. The address wins over the area code.
  location_basis   text check (location_basis in ('address', 'zip', 'area_code')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check ((latitude is null) = (longitude is null)),
  check ((latitude is null) = (location_basis is null)),
  check (phone is not null or email is not null)
);

create index contacts_phone_idx on genisa.contacts (phone) where phone is not null;
create index contacts_email_idx on genisa.contacts (email) where email is not null;

-- Every source a contact has appeared in, and when it was first seen there.
create table genisa.contact_sources (
  contact_id       bigint not null references genisa.contacts (id) on delete cascade,
  source_code      text not null references genisa.sources (code),
  first_upload_id  bigint references genisa.uploads (id) on delete set null,
  first_seen_at    timestamptz not null default now(),
  primary key (contact_id, source_code)
);

create index contact_sources_source_idx on genisa.contact_sources (source_code);

-- Every row of every upload, kept as it arrived, and what happened to it.
create table genisa.raw_rows (
  id               bigint generated always as identity primary key,
  upload_id        bigint not null references genisa.uploads (id) on delete cascade,
  row_number       integer not null check (row_number >= 1),
  data             jsonb not null,
  contact_id       bigint references genisa.contacts (id) on delete set null,
  outcome          text check (outcome in ('new', 'merged', 'rejected')),
  reject_reason    text,
  unique (upload_id, row_number),
  check ((outcome = 'rejected') = (reject_reason is not null))
);

create index raw_rows_contact_idx on genisa.raw_rows (contact_id) where contact_id is not null;

-- A tour is one run of half-day events. Distance and reuse rules are set per tour.
create table genisa.tours (
  id               bigint generated always as identity primary key,
  name             text not null,
  starts_on        date,
  ends_on          date,
  radius_miles     integer not null default 180 check (radius_miles between 1 and 1000),
  cooldown_days    integer not null default 90 check (cooldown_days between 0 and 730),
  created_by       text not null,
  created_at       timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

-- Event venues, synced from Eventbrite.
create table genisa.venues (
  id                   bigint generated always as identity primary key,
  tour_id              bigint not null references genisa.tours (id) on delete cascade,
  eventbrite_event_id  text unique,
  name                 text not null,
  address1             text,
  city                 text,
  state                text check (state ~ '^[A-Z]{2}$'),
  zip                  text check (zip ~ '^[0-9]{5}$'),
  latitude             double precision check (latitude between -90 and 90),
  longitude            double precision check (longitude between -180 and 180),
  event_date           date,
  check ((latitude is null) = (longitude is null))
);

create index venues_tour_idx on genisa.venues (tour_id);

-- A pond is one ProspectBoss list for a tour. Once exported it is locked.
create table genisa.ponds (
  id               bigint generated always as identity primary key,
  tour_id          bigint not null references genisa.tours (id) on delete restrict,
  pond_number      integer not null check (pond_number >= 1),
  list_type        text not null,
  exported_at      timestamptz,
  exported_by      text,
  created_at       timestamptz not null default now(),
  unique (tour_id, pond_number),
  check ((exported_at is null) = (exported_by is null))
);

-- Which contact went to which pond, and when. A contact is in at most one
-- pond per tour.
create table genisa.pond_assignments (
  id               bigint generated always as identity primary key,
  pond_id          bigint not null references genisa.ponds (id) on delete restrict,
  tour_id          bigint not null references genisa.tours (id) on delete restrict,
  contact_id       bigint not null references genisa.contacts (id) on delete restrict,
  assigned_at      timestamptz not null default now(),
  unique (tour_id, contact_id)
);

create index pond_assignments_pond_idx on genisa.pond_assignments (pond_id);
-- Used by the cool-down rule: "when was this contact last put in a pond?"
create index pond_assignments_contact_idx on genisa.pond_assignments (contact_id, assigned_at desc);

-- The assignment's tour must match its pond's tour.
create function genisa.check_assignment_tour() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from genisa.ponds where id = new.pond_id and tour_id = new.tour_id) then
    raise exception 'pond % does not belong to tour %', new.pond_id, new.tour_id;
  end if;
  return new;
end $$;

create trigger pond_assignments_tour_matches
  before insert or update on genisa.pond_assignments
  for each row execute function genisa.check_assignment_tour();

-- An exported pond is a record of what was sent to the ISAs: its contacts can
-- no longer be added, moved or removed, and it cannot be un-exported.
create function genisa.protect_exported_ponds() returns trigger
language plpgsql as $$
declare
  locked boolean;
begin
  if tg_table_name = 'ponds' then
    if tg_op = 'DELETE' then
      if old.exported_at is not null then
        raise exception 'pond % was exported on % and cannot be deleted', old.id, old.exported_at;
      end if;
      return old;
    end if;
    if old.exported_at is not null and (
         new.exported_at is distinct from old.exported_at
      or new.exported_by is distinct from old.exported_by
      or new.tour_id     is distinct from old.tour_id
      or new.pond_number is distinct from old.pond_number
      or new.list_type   is distinct from old.list_type) then
      raise exception 'pond % was exported on % and cannot be changed', old.id, old.exported_at;
    end if;
    return new;
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    select exported_at is not null into locked from genisa.ponds where id = old.pond_id;
    if locked then
      raise exception 'pond % has been exported; its contacts cannot be changed', old.pond_id;
    end if;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    select exported_at is not null into locked from genisa.ponds where id = new.pond_id;
    if locked then
      raise exception 'pond % has been exported; contacts cannot be added to it', new.pond_id;
    end if;
    return new;
  end if;
  return old;
end $$;

create trigger ponds_locked_after_export
  before update or delete on genisa.ponds
  for each row execute function genisa.protect_exported_ponds();

create trigger pond_assignments_locked_after_export
  before insert or update or delete on genisa.pond_assignments
  for each row execute function genisa.protect_exported_ponds();

-- People who must not be called or invited: DNC and Not Interested tags and
-- clients from Keap, people already registered from Eventbrite.
-- A row may match a known contact, or only a phone or email we have not seen yet.
create table genisa.exclusions (
  id               bigint generated always as identity primary key,
  contact_id       bigint references genisa.contacts (id) on delete cascade,
  phone            text check (phone ~ '^[2-9][0-9]{2}[2-9][0-9]{6}$'),
  email            text check (email = lower(email)),
  reason           text not null check (reason in ('dnc', 'not_interested', 'client', 'registered')),
  origin           text not null check (origin in ('keap', 'eventbrite', 'upload', 'manual')),
  external_ref     text,
  -- For 'registered': the tour the person registered for.
  tour_id          bigint references genisa.tours (id) on delete cascade,
  effective_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  check (contact_id is not null or phone is not null or email is not null),
  check ((reason = 'registered') = (tour_id is not null))
);

create index exclusions_contact_idx on genisa.exclusions (contact_id) where contact_id is not null;
create index exclusions_phone_idx on genisa.exclusions (phone) where phone is not null;
create index exclusions_email_idx on genisa.exclusions (email) where email is not null;
create unique index exclusions_external_unique on genisa.exclusions (origin, reason, external_ref)
  where external_ref is not null;

-- Registrations and check-ins, used to report show-ups by source and pond.
-- checked_in is null when the event recorded no check-in scans: that means
-- "no data", not "did not come".
create table genisa.attendance (
  id                      bigint generated always as identity primary key,
  tour_id                 bigint not null references genisa.tours (id) on delete cascade,
  venue_id                bigint references genisa.venues (id) on delete set null,
  contact_id              bigint references genisa.contacts (id) on delete set null,
  eventbrite_attendee_id  text unique,
  registered_at           timestamptz,
  checked_in              boolean,
  origin                  text not null check (origin in ('eventbrite', 'keap'))
);

create index attendance_tour_idx on genisa.attendance (tour_id);
create index attendance_contact_idx on genisa.attendance (contact_id) where contact_id is not null;

-- Who did what, for exports and other changes that matter later.
create table genisa.audit_log (
  id           bigint generated always as identity primary key,
  actor_email  text not null,
  action       text not null,
  details      jsonb not null default '{}'::jsonb,
  at           timestamptz not null default now()
);

create index audit_log_at_idx on genisa.audit_log (at desc);

-- Lock the schema away from Supabase's browser-facing roles where they exist.
do $$
declare
  r text;
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'genisa' loop
    execute format('alter table genisa.%I enable row level security', t.tablename);
  end loop;
  foreach r in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on schema genisa from %I', r);
      execute format('revoke all on all tables in schema genisa from %I', r);
    end if;
  end loop;
end $$;
