create extension if not exists pgcrypto;

create type profile_category as enum (
  'career',
  'project',
  'teaching',
  'online_course',
  'insight',
  'vibe_coding',
  'business'
);

create type material_priority as enum ('high', 'medium', 'low');

create type post_status as enum (
  'draft',
  'approved',
  'scheduled',
  'published',
  'failed',
  'cancelled'
);

create type job_type as enum (
  'generate_daily_draft',
  'send_daily_telegram',
  'publish_scheduled_post'
);

create type job_status as enum ('queued', 'running', 'succeeded', 'failed');

create type publish_status as enum (
  'pending',
  'sent_to_threads',
  'published',
  'failed'
);

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table philip_profiles (
  id uuid primary key default gen_random_uuid(),
  category profile_category not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  priority material_priority not null default 'medium',
  is_active boolean not null default true,
  used_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index philip_profiles_category_active_idx
  on philip_profiles (category, is_active);

create index philip_profiles_priority_active_idx
  on philip_profiles (priority, is_active);

create index philip_profiles_last_used_at_idx
  on philip_profiles (last_used_at);

create trigger set_philip_profiles_updated_at
before update on philip_profiles
for each row
execute function set_updated_at();

create table ai_settings (
  id uuid primary key default gen_random_uuid(),
  default_provider text not null,
  default_model text not null,
  custom_system_prompt text,
  tone_settings jsonb not null default '{}'::jsonb,
  telegram_chat_id text not null,
  telegram_send_time time not null default '07:00:00',
  default_post_time time not null default '09:00:00',
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_ai_settings_updated_at
before update on ai_settings
for each row
execute function set_updated_at();

create table posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references philip_profiles(id) on delete set null,
  source_snapshot jsonb not null,
  raw_content text,
  generated_content text not null,
  edited_content text,
  ai_provider text not null,
  ai_model text not null,
  status post_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  publish_status publish_status not null default 'pending',
  thread_id text,
  thread_permalink text,
  generation_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_status_scheduled_at_idx
  on posts (status, scheduled_at);

create index posts_publish_status_scheduled_at_idx
  on posts (publish_status, scheduled_at);

create index posts_created_at_desc_idx
  on posts (created_at desc);

create index posts_profile_id_idx
  on posts (profile_id);

create trigger set_posts_updated_at
before update on posts
for each row
execute function set_updated_at();

create table threads_accounts (
  id uuid primary key default gen_random_uuid(),
  threads_user_id text not null unique,
  username text,
  access_token text not null,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_threads_accounts_updated_at
before update on threads_accounts
for each row
execute function set_updated_at();

create table job_runs (
  id uuid primary key default gen_random_uuid(),
  job_type job_type not null,
  status job_status not null default 'queued',
  run_key text not null unique,
  started_at timestamptz,
  finished_at timestamptz,
  context jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create table publish_attempts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  attempt_number integer not null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  success boolean not null default false,
  error_message text,
  created_at timestamptz not null default now(),
  unique (post_id, attempt_number)
);

create index publish_attempts_post_attempt_idx
  on publish_attempts (post_id, attempt_number desc);

