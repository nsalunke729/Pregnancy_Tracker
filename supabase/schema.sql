-- =============================================
-- Pregnancy Tracker — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────
create table if not exists profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  name       text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- ── Pregnancies ────────────────────────────────
create table if not exists pregnancies (
  id         uuid    default uuid_generate_v4() primary key,
  owner_id   uuid    references auth.users(id) on delete cascade not null,
  partner_id uuid    references auth.users(id) on delete set null,
  lmp_date   date    not null,
  due_date   date    not null,
  baby_name  text,
  join_code  text    unique not null,
  created_at timestamptz default now()
);

-- ── Daily Logs ─────────────────────────────────
create table if not exists daily_logs (
  id            uuid  default uuid_generate_v4() primary key,
  pregnancy_id  uuid  references pregnancies(id) on delete cascade not null,
  date          date  not null,
  logged_by     uuid  references auth.users(id) not null,
  mood          smallint check (mood between 1 and 5),
  water_glasses smallint default 0,
  sleep_hours   numeric(3,1),
  notes         text,
  created_at    timestamptz default now(),
  unique(pregnancy_id, date)
);

-- ── Symptoms ───────────────────────────────────
create table if not exists symptoms (
  id           uuid    default uuid_generate_v4() primary key,
  log_id       uuid    references daily_logs(id) on delete cascade not null,
  symptom_type text    not null,
  severity     smallint check (severity between 1 and 10) not null
);

-- ── Medicines ──────────────────────────────────
create table if not exists medicines (
  id           uuid    default uuid_generate_v4() primary key,
  pregnancy_id uuid    references pregnancies(id) on delete cascade not null,
  name         text    not null,
  dosage       text,
  times        text[]  default '{}',
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ── Medicine Logs ──────────────────────────────
create table if not exists medicine_logs (
  id          uuid    default uuid_generate_v4() primary key,
  medicine_id uuid    references medicines(id) on delete cascade not null,
  date        date    not null,
  taken       boolean default false,
  unique(medicine_id, date)
);

-- ── Kick Sessions ──────────────────────────────
create table if not exists kick_sessions (
  id               uuid    default uuid_generate_v4() primary key,
  pregnancy_id     uuid    references pregnancies(id) on delete cascade not null,
  date             date    not null default current_date,
  kick_count       integer default 0,
  duration_minutes integer,
  created_at       timestamptz default now()
);

-- ── Weight Logs ────────────────────────────────
create table if not exists weight_logs (
  id           uuid    default uuid_generate_v4() primary key,
  pregnancy_id uuid    references pregnancies(id) on delete cascade not null,
  date         date    not null,
  weight_kg    numeric(5,2) not null,
  logged_by    uuid    references auth.users(id) not null,
  unique(pregnancy_id, date)
);

-- ── Appointments ───────────────────────────────
create table if not exists appointments (
  id           uuid    default uuid_generate_v4() primary key,
  pregnancy_id uuid    references pregnancies(id) on delete cascade not null,
  date         timestamptz not null,
  type         text    not null,
  location     text,
  notes        text,
  questions    jsonb   default '[]',  -- [{id, q, a}] — pre-visit questions + doctor answers
  created_at   timestamptz default now()
);

-- If table already exists without the questions column, run:
-- alter table appointments add column if not exists questions jsonb default '[]';

-- =============================================
-- Helper Functions
-- =============================================

-- Join a pregnancy by its 6-char code.
-- Runs as security definer so it can bypass RLS to look up the row — the
-- joining user is not yet owner_id/partner_id, so a plain SELECT would return
-- nothing under the default policy.  auth.uid() is still the caller's UID.
create or replace function join_pregnancy_by_code(p_join_code text)
returns json language plpgsql security definer as $$
declare
  v_id         uuid;
  v_partner_id uuid;
  v_owner_id   uuid;
begin
  select id, owner_id, partner_id
    into v_id, v_owner_id, v_partner_id
    from pregnancies
   where join_code = upper(trim(p_join_code));

  if v_id is null then
    return json_build_object('error', 'not_found');
  end if;

  if v_owner_id = auth.uid() then
    return json_build_object('error', 'own_pregnancy');
  end if;

  if v_partner_id is not null then
    return json_build_object('error', 'already_joined');
  end if;

  update pregnancies set partner_id = auth.uid() where id = v_id;

  return json_build_object('success', true, 'pregnancy_id', v_id::text);
end;
$$;

-- =============================================
-- Row Level Security
-- =============================================

alter table profiles     enable row level security;
alter table pregnancies  enable row level security;
alter table daily_logs   enable row level security;
alter table symptoms     enable row level security;
alter table medicines    enable row level security;
alter table medicine_logs enable row level security;
alter table kick_sessions enable row level security;
alter table weight_logs  enable row level security;
alter table appointments enable row level security;

-- Profiles
create policy "own_profile_select" on profiles for select using (auth.uid() = id);
create policy "own_profile_insert" on profiles for insert with check (auth.uid() = id);
create policy "own_profile_update" on profiles for update using (auth.uid() = id);

-- Helper: check pregnancy access
create or replace function user_has_pregnancy_access(p_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from pregnancies
    where id = p_id and (owner_id = auth.uid() or partner_id = auth.uid())
  );
$$;

-- Pregnancies
create policy "pregnancy_select" on pregnancies for select
  using (owner_id = auth.uid() or partner_id = auth.uid());
create policy "pregnancy_insert" on pregnancies for insert
  with check (owner_id = auth.uid());
create policy "pregnancy_update" on pregnancies for update
  using (owner_id = auth.uid() or partner_id = auth.uid());

-- Daily logs
create policy "logs_all" on daily_logs for all
  using (user_has_pregnancy_access(pregnancy_id));

-- Symptoms (access via parent log)
create policy "symptoms_all" on symptoms for all
  using (exists (
    select 1 from daily_logs dl
    where dl.id = log_id and user_has_pregnancy_access(dl.pregnancy_id)
  ));

-- Medicines
create policy "medicines_all" on medicines for all
  using (user_has_pregnancy_access(pregnancy_id));

-- Medicine logs (access via parent medicine)
create policy "medicine_logs_all" on medicine_logs for all
  using (exists (
    select 1 from medicines m
    where m.id = medicine_id and user_has_pregnancy_access(m.pregnancy_id)
  ));

-- Kick sessions
create policy "kicks_all" on kick_sessions for all
  using (user_has_pregnancy_access(pregnancy_id));

-- Weight logs
create policy "weight_all" on weight_logs for all
  using (user_has_pregnancy_access(pregnancy_id));

-- Appointments
create policy "appt_all" on appointments for all
  using (user_has_pregnancy_access(pregnancy_id));
