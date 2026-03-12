# Research

## 1. System Overview

This repository is the delivery vehicle for the "Philip Designer Threads automated content system" described in the planning document dated March 2026. The product goal is not generic social automation; it is a business funnel that turns Philip's design experience into recurring Threads posts that generate:

- online lecture inquiries
- education and academy partnerships
- design project leads
- vibe-coding website project inquiries

The planned runtime flow is:

1. Admin stores structured source material about Philip.
2. AI selects source material and generates a draft in Philip's tone.
3. Admin receives a morning Telegram bot message and can review or adjust the draft.
4. Approved content is published to Threads at the scheduled time.

## 2. Current Codebase State

The repository was empty at the time of inspection.

- No application code existed.
- No database schema or migration tooling existed.
- No frontend app existed.
- No backend API existed.
- No ORM or SQL ownership convention existed.
- No deployment, CI, or environment loading strategy existed.
- No project documentation existed.

This means the "existing system" for this turn is the product plan itself plus the newly created Jira structure. Any implementation work must therefore start by establishing architecture, folder boundaries, tooling, and delivery conventions.

## 3. Intended Architecture From The Product Plan

### 3.1 Runtime layers

The product plan defines four logical layers:

1. Data input layer
   Admin dashboard for profile source material and operational settings.
2. AI content generation layer
   Material selection, prompt orchestration, model invocation, and post-processing.
3. Review and approval layer
   Morning Telegram notifications and dashboard editing/regeneration flow.
4. Automated publishing layer
   Scheduled Threads publishing with success/failure tracking.

### 3.2 Planned technical split

- Frontend: Next.js 14 App Router dashboard
- Backend: Node.js + Express API server
- Database: Supabase PostgreSQL
- AI providers: Claude, OpenAI, Gemini
- Scheduling: Cron via Vercel/Railway
- Notifications: Telegram Bot API
- Social publishing: Threads Graph API

## 4. Module Analysis

Because the repository started empty, this section describes the target module model now being established.

### 4.1 `apps/web`

Role:
- Own the admin-facing Next.js dashboard surface.
- Host route-level screens such as overview, profile management, calendar, library, and settings.
- Call backend endpoints or server actions for data retrieval and mutations.

Expected responsibilities:
- authentication-aware route protection
- draft review actions
- schedule update actions
- AI settings submission
- Threads connection status display

Current state:
- only a minimal shell exists after bootstrap
- no product UI has been implemented
- route-level middleware now blocks future dashboard paths without a Supabase session cookie
- no approved dashboard layout work has started

### 4.2 `apps/api`

Role:
- Own business logic, integrations, cron-safe endpoints, and database orchestration.
- Expose health and operational APIs to the dashboard and external schedulers.

Expected responsibilities:
- profile material CRUD
- AI generation orchestration
- Telegram notifications
- Threads OAuth and publishing
- scheduling and retry workflows
- audit/event logging

Current state:
- only a minimal Express health server exists after bootstrap
- admin-only API middleware now validates Supabase bearer tokens against an env-backed admin allowlist
- protected cron routes now execute job runner logic with deterministic `run_key` handling
- Telegram bot client and preview message template are now wired behind an admin test endpoint
- Threads OAuth/publish client and integration routes are now wired for token exchange and test publishing
- no feature endpoints are implemented yet

### 4.3 Planned support areas not yet created

- `supabase/` or equivalent migration folder for SQL migrations and optional seeds
- shared schema/validation package if API and web start sharing zod or typed contracts
- Telegram message formatting module
- AI provider client modules
- Threads API integration modules

## 5. Layer Boundaries

### 5.1 UI layer

Planned location:
- `apps/web/app/**`

Boundary:
- UI should remain focused on routing, rendering, forms, and invoking server capabilities.
- Styling and screen composition are approval-gated for this project.
- Complex provider logic, scheduling rules, Threads publishing, and persistence rules must not live in the UI layer.

### 5.2 Server and business layer

Planned location:
- `apps/api/src/**`

Boundary:
- Owns validation, orchestration, integrations, cron authentication, persistence, and observability.
- Returns stable contracts to frontend callers.
- Protects any admin-only or machine-only endpoints.

### 5.3 Data layer

Planned location:
- Supabase Postgres plus migration files in repository-managed SQL

Boundary:
- schema, indexes, enums, audit fields, schedule state, and publish state should be managed centrally
- domain logic stays in the API layer rather than inside ad hoc SQL spread across the UI

## 6. ORM And Database Management Analysis

There is currently no ORM or migration system in the repository.

Observations:
- The planning document references Supabase/PostgreSQL directly, not Prisma/Drizzle specifically.
- For this project, SQL-first migrations are a good fit because:
  - Supabase works naturally with SQL migrations
  - enum-heavy workflow data is easy to model directly
  - cron jobs and API services do not require full ORM abstraction on day one

Recommended ownership model:
- repository-managed SQL migrations
- typed validation schemas in application code
- optional query helper layer in the API package
- schema reference document at `/Users/chulwan/Documents/GitHub/designer_threadbot/docs/db-schema.md`
- bootstrap SQL at `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/migrations/0001_initial.sql`
- local sample seed at `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/seed.sql`

Planned core entities from the product document:
- `philip_profiles`
- `posts`
- `ai_settings`
- additional operational tables likely needed:
  - `threads_accounts`
  - `job_runs`
  - `publish_attempts`

The first-pass schema design for these tables is now documented in `docs/db-schema.md`.

## 7. API Endpoint Analysis

### 7.1 Existing endpoints

At inspection time:
- none existed

After bootstrap:
- `GET /health`
  - returns service name and status
  - purpose: smoke-test the API package and deployment wiring
- `GET /admin/health`
  - requires bearer token and admin allowlist match
  - purpose: verify the server-side auth boundary before real admin APIs are added
- `POST /admin/telegram/test`
  - requires bearer token and admin allowlist match
  - purpose: verify Telegram bot delivery and preview message formatting before the scheduled flow is attached
- `GET /integrations/threads/oauth/start`
- `GET /integrations/threads/oauth/callback`
- `POST /integrations/threads/publish-test`
  - publish test requires bearer token and admin allowlist match
  - purpose: verify OAuth exchange and text-post publish flow before full persistence is attached
- `POST /cron/generate-daily-draft`
- `POST /cron/send-daily-telegram`
- `POST /cron/publish-approved-posts`
  - each requires `x-cron-secret`
  - current purpose: establish protected entrypoints and `job_runs`-based execution flow before business logic is implemented

### 7.2 Planned endpoint families

Profile material:
- `GET /api/profile-materials`
- `POST /api/profile-materials`
- `PATCH /api/profile-materials/:id`
- `DELETE /api/profile-materials/:id`

AI operations:
- `POST /api/drafts/generate`
- `POST /api/drafts/:id/regenerate`
- `POST /api/settings/ai`

Scheduling and review:
- `PATCH /api/posts/:id/schedule`
- `POST /api/posts/:id/approve`
- `POST /api/posts/:id/cancel`

Automation:
- `POST /api/cron/generate-daily-draft`
- `POST /api/cron/send-daily-telegram`
- `POST /api/cron/publish-approved-posts`

Threads:
- `GET /api/integrations/threads/oauth/start`
- `GET /api/integrations/threads/oauth/callback`
- `GET /api/integrations/threads/status`

These are design targets only. They do not exist yet.

## 8. Technology Stack Analysis

### 8.1 Current bootstrap stack

- Workspace management: npm workspaces
- Frontend framework shell: Next.js App Router
- Backend server shell: Express
- Language: TypeScript
- Tooling: ESLint, Prettier
- Environment validation: dotenv + zod in API bootstrap

### 8.2 Planned runtime stack

- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Notifications: Telegram Bot API
- AI: Claude, OpenAI, Gemini abstraction layer
- Scheduling: Vercel/Railway cron endpoints
- Deployment: Vercel for web, Railway for API

## 9. Risks, Gaps, And Improvement Areas

### 9.1 Immediate gaps

- No real feature code existed before this turn.
- No schema, migrations, or local database bootstrap exists yet.
- No environment variable contract exists yet.
- No CI or test gate exists yet.
- No operational logging or audit design exists yet.

### 9.2 Product-level risks carried from the planning document

- Threads API policy changes
- AI output quality drift
- source material exhaustion after repeated operation
- token and API cost management
- retry/idempotency needs for scheduled publishing

### 9.3 Implementation guidance

- Build non-UI infrastructure first.
- Keep UI work frozen until explicit approval.
- Treat cron routes and publish actions as idempotent from the start.
- Store source material and post lifecycle state separately.
- Centralize prompt building so style changes are auditable.

## 10. Initial Conclusion

This project is starting from a blank repository, not from an existing implementation. The first useful milestone is therefore a disciplined foundation:

- documented architecture
- Jira execution structure
- monorepo bootstrap
- migration strategy
- environment contract
- first non-UI server and data tasks

That foundation is now being created in this repository.
