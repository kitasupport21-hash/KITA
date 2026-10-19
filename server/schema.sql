create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  skills text[] not null default '{}',
  preferred_modes text[] not null default '{}',
  preferred_provinces text[] not null default '{}',
  target_levels text[] not null default '{}',
  minimum_salary_jt numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  title text not null,
  company text not null,
  province text,
  city text,
  salary_min_jt numeric,
  salary_max_jt numeric,
  work_mode text,
  level text,
  tags text[] not null default '{}',
  description text,
  source_name text not null,
  source_url text,
  apply_url text,
  verified boolean not null default false,
  status text not null default 'active',
  posted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(source_name, external_id)
);

create table if not exists saved_jobs (
  profile_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(profile_id, job_id)
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  job_id uuid references jobs(id) on delete cascade,
  status text not null default 'saved',
  applied_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, job_id)
);

create index if not exists jobs_location_idx on jobs(province, city);
create index if not exists jobs_status_posted_idx on jobs(status, posted_at desc);
