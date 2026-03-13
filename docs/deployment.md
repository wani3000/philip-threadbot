# Deployment And Cron Conventions

## 1. Target Topology

- `apps/web`
  - deploy to Vercel
  - responsibility: admin dashboard shell and future authenticated dashboard routes
- `apps/api`
  - deploy to Vercel
  - responsibility: business logic, cron entrypoints, Threads integration, Telegram delivery, protected admin APIs, and operational logging

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

- Vercel cron method: `GET`
- manual fallback method: `POST`
- auth header:
  - Vercel cron: `Authorization: Bearer <CRON_SECRET>`
  - manual fallback: `x-cron-secret: <CRON_SECRET>`
- secret source: `CRON_SECRET`

Current placeholders:

- `POST /cron/generate-daily-draft`
- `POST /cron/send-daily-telegram`
- `POST /cron/publish-approved-posts`

These routes are now live entrypoints and return job-run acceptance payloads backed by `job_runs` state.

Current `apps/api/vercel.json` schedule in UTC:

- `0 15 * * *` → KST `00:00` draft generation
- `0 22 * * *` → KST `07:00` Telegram preview
- `0 0 * * *` → KST `09:00` Threads publish

## 4. Execution Order

Recommended daily order:

1. Night job generates tomorrow's draft.
2. Morning job sends the tomorrow-post preview via Telegram bot.
3. Publish job posts approved scheduled content to Threads.

## 5. Local Review Path

Before production credentials are attached, the system can run in local demo mode.

- API demo mode uses in-memory sample data, simulated AI generation, and simulated Telegram delivery.
- Web middleware can be bypassed in local review with `NEXT_PUBLIC_LOCAL_DEMO_MODE=true`.
- This mode is intended for stakeholder review before real Threads OAuth verification.

## 6. Security Rules

- Cron routes must never be public.
- Admin APIs and cron APIs must use different validation mechanisms.
- Telegram bot token and Threads credentials stay server-side only.
- UI work must not call publish endpoints directly without server-side authorization.
- `LOCAL_DEMO_MODE` must remain `false` outside local development.

## 7. Operational Notes

- Job implementations should create deterministic `job_runs.run_key` values.
- Re-running the same cron window should be safe.
- Telegram preview delivery should be independent from final Threads publish success.
- Audit logs should persist in Supabase outside demo mode so records survive restarts.
