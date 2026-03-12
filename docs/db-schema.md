# Database Schema PRD

## 1. Purpose

This document translates the March 2026 planning brief into a first-pass PostgreSQL schema for Supabase. The design goal is to support the MVP first:

- structured profile source material storage
- AI draft generation traceability
- review/edit/schedule lifecycle
- Telegram notification configuration
- Threads publishing state tracking
- operational audit trail

This schema intentionally favors explicit lifecycle columns and operational traceability over abstraction-heavy modeling.

## 2. Design Principles

- Use SQL-first migrations and keep schema ownership in-repo.
- Preserve traceability from every post back to source material and selected AI model.
- Keep settings centralized because the system is admin-operated.
- Separate scheduled publishing state from generation state.
- Design cron-facing tables for idempotent retries.

## 3. Enum Types

### `profile_category`

- `career`
- `project`
- `startup_story`
- `teaching_mentoring`
- `designer_insight`
- `vibe_coding`

Notes:

- The canonical category structure mirrors `/Users/chulwan/Downloads/philip_content_database.docx`.
- Korean dashboard buckets map directly as:
  - `경력` -> `career`
  - `프로젝트` -> `project`
  - `창업스토리` -> `startup_story`
  - `강의멘토링` -> `teaching_mentoring`
  - `디자이너인사이트` -> `designer_insight`
  - `바이브코딩` -> `vibe_coding`

### `material_priority`

- `high`
- `medium`
- `low`

### `post_status`

- `draft`
- `approved`
- `scheduled`
- `published`
- `failed`
- `cancelled`

### `job_type`

- `generate_daily_draft`
- `send_daily_telegram`
- `publish_scheduled_post`

### `job_status`

- `queued`
- `running`
- `succeeded`
- `failed`

### `publish_status`

- `pending`
- `sent_to_threads`
- `published`
- `failed`

## 4. Core Tables

### 4.1 `philip_profiles`

Purpose:

- Stores reusable source material about Philip that the AI pipeline can turn into content.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `category profile_category not null`
- `title text not null`
- `content text not null`
- `tags text[] not null default '{}'`
- `priority material_priority not null default 'medium'`
- `is_active boolean not null default true`
- `used_count integer not null default 0`
- `last_used_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(category, is_active)`
- `(priority, is_active)`
- `(last_used_at)`

Notes:

- `used_count` and `last_used_at` support weighted round-robin selection.

### 4.2 `posts`

Purpose:

- Canonical content table for generated drafts through final publish lifecycle.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `profile_id uuid references philip_profiles(id) on delete set null`
- `source_snapshot jsonb not null`
- `raw_content text`
- `generated_content text not null`
- `edited_content text`
- `final_content text generated always as (coalesce(edited_content, generated_content)) stored`
- `ai_provider text not null`
- `ai_model text not null`
- `status post_status not null default 'draft'`
- `scheduled_at timestamptz`
- `published_at timestamptz`
- `publish_status publish_status not null default 'pending'`
- `thread_id text`
- `thread_permalink text`
- `generation_notes jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(status, scheduled_at)`
- `(publish_status, scheduled_at)`
- `(created_at desc)`
- `(profile_id)`

Notes:

- `source_snapshot` preserves the exact source material used at generation time even if the original profile row changes later.
- `final_content` avoids repeated coalesce logic in application code.

### 4.3 `ai_settings`

Purpose:

- Stores system-wide admin settings for generation and Telegram notification behavior.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `default_provider text not null`
- `default_model text not null`
- `custom_system_prompt text`
- `tone_settings jsonb not null default '{}'::jsonb`
- `telegram_chat_id text not null`
- `telegram_send_time time not null default '07:00:00'`
- `default_post_time time not null default '09:00:00'`
- `timezone text not null default 'Asia/Seoul'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Notes:

- MVP expects one active settings row. Application logic should enforce singleton semantics.

## 5. Operational Tables

### 5.1 `threads_accounts`

Purpose:

- Stores Threads integration and token metadata.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `threads_user_id text not null unique`
- `username text`
- `access_token text not null`
- `token_expires_at timestamptz`
- `scopes text[] not null default '{}'`
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### 5.2 `job_runs`

Purpose:

- Audit trail for cron-triggered execution.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `job_type job_type not null`
- `status job_status not null default 'queued'`
- `run_key text not null unique`
- `started_at timestamptz`
- `finished_at timestamptz`
- `context jsonb not null default '{}'::jsonb`
- `error_message text`
- `created_at timestamptz not null default now()`

Notes:

- `run_key` should be deterministic for retry safety, for example `generate_daily_draft:2026-03-13`.

### 5.3 `publish_attempts`

Purpose:

- Tracks every attempt to publish a post to Threads.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `post_id uuid not null references posts(id) on delete cascade`
- `attempt_number integer not null`
- `request_payload jsonb not null default '{}'::jsonb`
- `response_payload jsonb not null default '{}'::jsonb`
- `success boolean not null default false`
- `error_message text`
- `created_at timestamptz not null default now()`

Indexes:

- `(post_id, attempt_number desc)`

### 5.4 `audit_logs`

Purpose:

- Captures significant admin and system actions for debugging, accountability, and launch-readiness review.

Columns:

- `id uuid primary key default gen_random_uuid()`
- `action text not null`
- `entity_type text not null`
- `entity_id text`
- `actor_type text not null`
- `actor_identifier text not null`
- `request_id text`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Indexes:

- `(created_at desc)`
- `(entity_type, entity_id)`

## 6. Lifecycle Rules

### 6.1 Source material lifecycle

1. Admin creates or edits `philip_profiles`.
2. Generator selects one or more active rows.
3. On successful generation:
   - increment `used_count`
   - update `last_used_at`
   - persist `source_snapshot` into `posts`

### 6.2 Post lifecycle

1. Generated post starts as `draft`.
2. Admin may edit draft content.
3. Approved content moves to `approved`.
4. When a publish time exists, content moves to `scheduled`.
5. Publish job sets `publish_status` and final `status`.
6. Publish failure sets `status = 'failed'`.
7. Manual skip sets `status = 'cancelled'`.

### 6.3 Job lifecycle

1. Scheduler creates or checks `job_runs` by `run_key`.
2. If `run_key` already succeeded, the job exits safely.
3. If not, it runs and records `started_at`, `finished_at`, and `context`.

## 7. MVP Scope Versus Later Scope

### MVP tables

- `philip_profiles`
- `posts`
- `ai_settings`
- `threads_accounts`
- `job_runs`
- `publish_attempts`
- `audit_logs`

### Later possible additions

- `post_tags` if hashtags need separate analytics
- `telegram_deliveries` if delivery troubleshooting becomes important
- `post_metrics` if Threads insights become part of reporting
- `audit_log_archives` if long-term retention becomes important

## 8. API Coupling Notes

Tables mapped to early APIs:

- `philip_profiles` → profile CRUD endpoints
- `posts` → draft review, scheduling, and publishing endpoints
- `ai_settings` → settings management endpoints
- `job_runs` → cron routes and operational diagnostics
- `publish_attempts` → publishing retry UI and logs
- `audit_logs` → admin audit log endpoint and dashboard operations feed

## 9. Security And Access Notes

- This is an admin-operated system, so all write operations should require authenticated admin context.
- Secrets such as Threads access tokens should never be exposed to the web layer.
- Supabase Row Level Security can remain simple for MVP if only one admin account exists, but policies should still be defined before production launch.

## 10. Next Step

The next implementation step is `PT-11`: convert this PRD into repository-managed SQL migrations inside `supabase/migrations`.
