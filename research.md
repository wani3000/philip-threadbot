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

The current implementation adds a fifth practical layer:

5. Quality and launch-readiness layer
   Structured logs, audit trails, local demo-mode verification, and release gates before live credentials are attached.

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
- route-level middleware now blocks future dashboard paths without a Supabase session cookie
- approved dashboard UI is now implemented for overview, profile, calendar, library, and AI settings

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
- provider abstraction, draft generation, and profile material CRUD APIs are now scaffolded behind protected routes
- post listing/update/regeneration routes and AI settings routes now support the dashboard surface
- the draft prompt builder now applies a three-stage writing contract derived from `simon-writing`, Philip voice conversion rules, and Threads-specific output constraints
- request-level logging, request IDs, and centralized error envelopes are now wired into the API bootstrap
- audit events can now be stored in Supabase or in a local in-memory store for demo mode
- the API now has a demo-mode runtime path that works without Supabase, AI provider keys, Telegram token, or Threads credentials

### 4.3 Planned support areas not yet created

- `supabase/` or equivalent migration folder for SQL migrations and optional seeds
- shared schema/validation package if API and web start sharing zod or typed contracts
- Telegram message formatting module
- AI provider client modules
- Threads API integration modules

### 4.4 Draft prompt design contract

The draft pipeline is no longer a generic "write a Threads post" instruction. It now follows a fixed three-stage prompt contract:

1. `simon-writing` style injection
   - begin from a scene, observation, or number instead of abstract framing
   - avoid opening with first-person self-introduction
   - move through situation -> what Philip missed -> solution -> result
   - let the insight arrive near the end
   - alternate short and long sentences
   - include one metaphor that supports the argument
2. Philip voice conversion
   - convert to polite Korean
   - bring in first-person project experience
   - use designer vocabulary around structure, visibility, user flow, and decision-making
   - include measurable results whenever the material supports them
3. Threads optimization
   - keep the post around 500 characters
   - use line breaks to shape reading rhythm
   - make the first line act as a hook
   - end with 3 to 5 hashtags

Reference inspiration:

- public repository: [juliuschun/simon-writing](https://github.com/juliuschun/simon-writing)
- implementation point: `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/prompt.ts`

Example transformation captured from the planning update:

- source material:
  - cryptocurrency tracking tool
  - 800 reports
  - KRW 240 billion traced
  - used by Korean National Police Agency, Kakao, Samsung Electronics
- desired output shape:
  - opens from a concrete operational scene
  - reveals that the real problem was not data absence but structure
  - lands on the result metric near the end
  - closes with tightly scoped hashtags

### 4.5 Demo-mode local runtime

Because this project needs stakeholder review before real Threads credentials are connected, the repository now supports a local demo mode.

Behavior:

- Admin auth can be satisfied with a local bearer token instead of a Supabase user session.
- Sample profile materials, settings, and scheduled posts are served from an in-memory store.
- Draft generation uses a deterministic local writer instead of external AI APIs.
- Telegram test sends return a simulated success payload.
- Audit logs are stored in memory and surfaced on the dashboard home screen.

Scope:

- This mode is for UI and workflow review only.
- Threads OAuth and test publishing still require real Meta credentials and remain outside the demo path.

## 5. Layer Boundaries

### 5.1 UI layer

Planned location:

- `apps/web/app/**`

Boundary:

- UI should remain focused on routing, rendering, forms, and invoking server capabilities.
- Styling and screen composition are approval-gated for this project.
- Complex provider logic, scheduling rules, Threads publishing, and persistence rules must not live in the UI layer.

Current compromise:

- the web app uses server actions that call the API with `ADMIN_BEARER_TOKEN` on the server side
- this keeps mutations out of the browser, but it is still a bootstrap bridge until full session-bound auth wiring is added

### 5.2 Server and business layer

Planned location:

- `apps/api/src/**`

Boundary:

- Owns validation, orchestration, integrations, cron authentication, persistence, and observability.
- Returns stable contracts to frontend callers.
- Protects any admin-only or machine-only endpoints.
- Provides a local demo fallback when live infrastructure is intentionally absent.

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
  - `audit_logs`

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
- `GET /api/audit-logs`
  - requires bearer token and admin allowlist match
  - purpose: expose recent audit entries to the dashboard and operations review
- `POST /admin/telegram/test`
  - requires bearer token and admin allowlist match
  - purpose: verify Telegram bot delivery and preview message formatting before the scheduled flow is attached
- `GET /api/profile-materials`
- `POST /api/profile-materials`
- `PATCH /api/profile-materials/:id`
- `DELETE /api/profile-materials/:id`
  - requires bearer token and admin allowlist match
  - purpose: manage structured source material
- `POST /api/drafts/generate`
  - requires bearer token and admin allowlist match
  - purpose: select source material, run the chosen AI provider, and persist a draft row
- `GET /api/posts`
- `PATCH /api/posts/:id`
- `POST /api/posts/:id/regenerate`
  - requires bearer token and admin allowlist match
  - purpose: drive dashboard review, schedule editing, cancellation, and draft regeneration
- `GET /api/ai-settings`
- `PUT /api/ai-settings`
  - requires bearer token and admin allowlist match
  - purpose: drive the AI settings screen and future regeneration controls
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

The remaining endpoints in this section are design targets if they are not listed above as already implemented.

## 8. Technology Stack Analysis

### 8.1 Current bootstrap stack

- Workspace management: npm workspaces
- Frontend framework shell: Next.js App Router
- Backend server shell: Express
- Language: TypeScript
- Tooling: ESLint, Prettier
- Environment validation: dotenv + zod in API bootstrap
- API integrations: direct HTTP clients for Anthropic, OpenAI Responses API, Gemini generateContent, Telegram Bot API, and Threads Graph API
- Prompt orchestration: repository-managed system prompt template with fixed `simon-writing`-derived stage rules and optional per-admin custom prompt extension
- UI styling: Next.js App Router with global CSS, server components, and server actions
- Observability: structured JSON logging, request IDs, centralized error envelopes, audit log persistence
- CI: GitHub Actions workflow for format, lint, typecheck, and build

### 8.2 Planned runtime stack

- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Notifications: Telegram Bot API
- AI: Claude, OpenAI, Gemini abstraction layer
- Scheduling: Vercel/Railway cron endpoints
- Deployment: Vercel for web, Railway for API

## 9. Risks, Gaps, And Improvement Areas

### 9.1 Immediate gaps

- Threads live integration still depends on missing production credentials and real OAuth validation.
- Browser-bound Supabase session auth is still not implemented; the dashboard uses a bootstrap machine token bridge.
- Automated tests beyond format/lint/typecheck/build do not exist yet.

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

This project started from a blank repository and now has a working MVP dashboard/API foundation, pre-credential demo mode, and launch-readiness scaffolding. The next meaningful milestone is no longer bootstrap; it is real-environment validation of Telegram and Threads integrations.
