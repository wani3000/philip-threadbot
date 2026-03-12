# Deployment And Cron Conventions

## 1. Target Topology

- `apps/web`
  - deploy to Vercel
  - responsibility: admin dashboard shell and future authenticated dashboard routes
- `apps/api`
  - deploy to Railway
  - responsibility: business logic, cron entrypoints, Threads integration, Telegram delivery, and protected admin APIs

## 2. Environment Ownership

### Web

- runtime focus: route middleware and future dashboard routes
- minimal required env today:
  - `APP_URL`

### API

- `PORT`
- `CRON_SECRET`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `THREADS_APP_ID`
- `THREADS_APP_SECRET`
- `THREADS_ACCESS_TOKEN`
- `THREADS_USER_ID`
- `TELEGRAM_BOT_TOKEN`
- `ADMIN_EMAILS`

## 3. Cron Entrypoint Contract

All cron endpoints live under `/cron/*` and require:

- HTTP method: `POST`
- header: `x-cron-secret`
- secret source: `CRON_SECRET`

Current placeholders:

- `POST /cron/generate-daily-draft`
- `POST /cron/send-daily-telegram`
- `POST /cron/publish-approved-posts`

These currently return `501 not_implemented` intentionally until the job logic lands.

## 4. Execution Order

Recommended daily order:

1. Night job generates tomorrow's draft.
2. Morning job sends the tomorrow-post preview via Telegram bot.
3. Publish job posts approved scheduled content to Threads.

## 5. Security Rules

- Cron routes must never be public.
- Admin APIs and cron APIs must use different validation mechanisms.
- Telegram bot token and Threads credentials stay server-side only.
- UI work must not call publish endpoints directly without server-side authorization.

## 6. Operational Notes

- Job implementations should create deterministic `job_runs.run_key` values.
- Re-running the same cron window should be safe.
- Telegram preview delivery should be independent from final Threads publish success.

