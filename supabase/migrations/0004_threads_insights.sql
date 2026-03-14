create table threads_account_insights_snapshots (
  id uuid primary key default gen_random_uuid(),
  threads_user_id text not null,
  views integer,
  likes integer,
  replies integer,
  reposts integer,
  quotes integer,
  followers_count integer,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index threads_account_insights_user_created_idx
  on threads_account_insights_snapshots (threads_user_id, created_at desc);

create table threads_post_insights_snapshots (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  threads_media_id text not null,
  views integer,
  likes integer,
  replies integer,
  reposts integer,
  quotes integer,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index threads_post_insights_post_created_idx
  on threads_post_insights_snapshots (post_id, created_at desc);

create index threads_post_insights_media_created_idx
  on threads_post_insights_snapshots (threads_media_id, created_at desc);
