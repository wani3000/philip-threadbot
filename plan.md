# Plan

## PT-1 Platform foundation and repository bootstrap

Subtasks:

- `PT-7` `[INFRA] Initialize monorepo workspace and baseline tooling` — executable now
- `PT-8` `[INFRA] Set up environment variable strategy and example files` — executable now
- `PT-9` `[INFRA] Establish deployment targets and cron entrypoint conventions` — executable now

Approach:

- Start by making the empty repository runnable.
- Keep the frontend shell minimal and avoid product UI work.
- Separate web and API packages immediately so later API logic does not leak into the dashboard layer.

Implementation plan:

`PT-7`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/package.json`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/tsconfig.base.json`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/eslint.config.mjs`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/prettier.config.mjs`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/*`
- Pseudocode:

```text
create root workspace config
create web package with minimal Next app shell
create api package with minimal Express health server
add lint/typecheck/build scripts
verify local install and commands
```

- Tradeoffs:
  - npm workspaces were chosen over Turborepo to reduce moving parts in an empty repo.
  - Minimal Next shell is included only to establish runtime boundaries, not to begin dashboard design.

`PT-8`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/.env.example`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/config/env.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/src/env/*`
- Pseudocode:

```text
define required env keys by integration
group env by web/api/shared ownership
validate process.env on startup
document safe local defaults
```

- Constraints:
  - Do not commit secrets.
  - Web-exposed variables must be clearly separated from server-only secrets.

`PT-9`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/cron/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/vercel.json` or deployment docs
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/README.md`
- Pseudocode:

```text
define cron route contract with shared auth secret
document deploy targets and ownership
separate web build from api service startup
```

- Constraints:
  - Scheduled entrypoints must be idempotent.
  - API routes must reject unauthenticated cron traffic.

Iteration:

- Pending feedback.

Todo List:

- `[x]` `PT-7` bootstrap monorepo and baseline tooling — agent: Codex
- `[x]` `PT-8` environment variable contract — agent: Codex
- `[x]` `PT-9` deployment and cron conventions — agent: Codex

## PT-2 Data model and authentication foundation

Subtasks:

- `PT-10` `[DB] Design initial Supabase schema and migration plan` — executable now
- `PT-11` `[DB] Implement database bootstrap migrations and seed strategy` — executable now
- `PT-12` `[BE] Implement admin authentication boundary` — executable now

Approach:

- Lock down schema shape early because every later module depends on it.
- Use SQL-first migrations for Supabase compatibility.
- Keep auth admin-only and avoid premature multi-user complexity.

Implementation plan:

`PT-10`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/research.md`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/docs/db-schema.md`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/migrations/*.sql`
- Pseudocode:

```text
define enums for category, priority, post_status
define profile materials table
define posts table with schedule and publish lifecycle fields
define settings and operational integration tables
add indexes for scheduled_at and status filters
```

- Tradeoffs:
  - SQL-first gives clarity and control.
  - Additional operational tables should be added before automation work to avoid schema churn.

`PT-11`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/migrations/0001_initial.sql`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/seed.sql`
- Pseudocode:

```text
create tables and triggers
add updated_at maintenance
insert optional local sample data
```

`PT-12`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/middleware.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/middleware/auth.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/supabase.ts`
- Pseudocode:

```text
verify session token
restrict dashboard routes to admin
reject API mutations without validated admin context
```

Iteration:

- Pending feedback.

Todo List:

- `[x]` `PT-10` schema design — agent: Codex
- `[x]` `PT-11` migration bootstrap — agent: Codex
- `[x]` `PT-12` admin auth boundary — agent: Codex

## PT-3 AI content generation pipeline

Subtasks:

- `PT-13` `[BE] Implement AI provider abstraction for Claude, OpenAI, and Gemini` — executable now
- `PT-14` `[BE] Build profile-to-draft generation pipeline` — executable now
- `PT-16` `[FE] Implement non-visual settings/actions for model selection and regeneration` — executable now

Approach:

- Keep provider-specific code behind a common interface.
- Make the prompt pipeline observable and testable.
- Separate draft generation from final publish state.

Implementation plan:

`PT-13`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/ai/providers/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/ai/types.ts`
- Pseudocode:

```text
interface generateDraft(input, model): output
providerMap = { claude, openai, gemini }
normalize request and response shape
```

`PT-14`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/drafts.ts`
- Pseudocode:

```text
select source material by priority and rotation
compose a three-stage prompt:
  1) simon-writing-inspired structure and rhythm
  2) Philip-specific polite designer voice
  3) Threads hook, line breaks, and hashtag constraints
run provider
apply post-processing and store draft
```

- Constraints:
  - enforce character and hashtag targets
  - preserve traceability to source material and selected model
  - keep the simon-writing contract fixed in code and append admin custom prompt as an extension rather than replacing the base rules

Implementation note:

- Prompt source reference: [juliuschun/simon-writing](https://github.com/juliuschun/simon-writing)
- Stage contract summary:
  - Stage 1: opening scene/observation, no `"저는"` lead, delayed insight, alternating sentence rhythm, one structural metaphor
  - Stage 2: polite tone, Philip's first-person experience, designer vocabulary, concrete numbers/results
  - Stage 3: first-line hook, about 500 characters, line-break rhythm, 3 to 5 hashtags

`PT-16`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/settings/ai/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/actions/ai.ts`
- Pseudocode:

```text
submit selected default model
trigger regeneration action
refresh draft data without styling commitments
```

Iteration:

- Pending feedback.

Todo List:

- `[x]` `PT-13` provider abstraction — agent: Codex
- `[x]` `PT-14` draft generation pipeline — agent: Codex
- `[x]` `PT-16` non-visual AI settings wiring — agent: Codex

## PT-4 Scheduling, Telegram notifications, and Threads publishing automation

Subtasks:

- `PT-15` `[INFRA] Implement scheduled jobs for nightly generation and morning Telegram notifications` — executable now
- `PT-17` `[BE] Integrate draft notification Telegram bot delivery` — executable now
- `PT-18` `[BE] Implement Threads OAuth and publishing workflow` — executable now

Approach:

- Treat automation as deterministic background work with retry-safe state transitions.
- Store every job outcome so manual investigation is possible.

Implementation plan:

`PT-15`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/cron/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/jobs/*`
- Pseudocode:

```text
verify cron secret
generate next-day draft at night
send morning telegram preview
mark run results
```

`PT-17`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/telegram/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/templates/*`
- Pseudocode:

```text
render draft telegram message
include schedule time, model, material source, edit link
send via Telegram bot adapter
```

`PT-18`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/threads/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/integrations/threads.ts`
- Pseudocode:

```text
exchange oauth code for token
store token metadata
create threads container
publish container
record permalink and thread id
```

Iteration:

- Pending feedback.

Todo List:

- `[x]` `PT-15` cron jobs — agent: Codex
- `[x]` `PT-17` Telegram delivery — agent: Codex
- `[x]` `PT-18` Threads workflow — agent: Codex

## PT-5 Dashboard operations and content management

Subtasks:

- `PT-19` `[BE] Implement profile material CRUD APIs and validation` — executable now
- `PT-20` `[FE] Implement dashboard data flows for draft review and scheduling operations` — executable now
- `PT-21` `[UI] Build home dashboard layout and tomorrow-post review surface` — approval required
- `PT-22` `[UI] Build profile management, calendar, and library screens` — approval required

Approach:

- Finish server capabilities before final screens.
- Keep data mutations available through forms/actions even while UI design is frozen.

Implementation plan:

`PT-19`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/profile-materials.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/validation/profile-material.ts`
- Pseudocode:

```text
validate payload
create/update/delete material
filter inactive entries
```

`PT-20`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/actions/posts.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/(dashboard)/*`
- Pseudocode:

```text
load tomorrow draft
submit regenerate/cancel/reschedule actions
refresh data after mutation
```

`PT-21`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/components/dashboard/*`
- Status:
  - `완료`

`PT-22`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/profile/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/calendar/*`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/library/*`
- Status:
  - `완료`

Iteration:

- Pending feedback.

Todo List:

- `[x]` `PT-19` profile CRUD APIs — agent: Codex
- `[x]` `PT-20` dashboard data flows — agent: Codex
- `[x]` `PT-21` home dashboard UI — agent: Codex
- `[x]` `PT-22` management/calendar/library UI — agent: Codex

## PT-6 Quality, observability, and launch readiness

Subtasks:

- `PT-23` `[BE] 구조화 로그, 에러 처리, 감사 로그 구현` — executable now
- `PT-24` `[INFRA] 테스트 전략, CI 체크, 릴리즈 게이트 정의` — executable now

Approach:

- Build operational safety before live account publishing.
- Make failure states observable, especially around cron and Threads publishing.
- Provide a local review path that works before real Threads credentials are supplied.

Implementation plan:

`PT-23`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/logger.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/middleware/error-handler.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/audit.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/audit-logs.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/demo-store.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/migrations/0002_audit_logs.sql`
- Pseudocode:

```text
wrap request lifecycle logging
emit structured errors
record publish and generation attempts
surface recent audit logs to dashboard
support local demo fallback for auth, data, telegram, and draft generation
```

`PT-24`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/.github/workflows/ci.yml`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/package.json`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/README.md`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/docs/release-checklist.md`
- Pseudocode:

```text
run install
run format
run lint
run typecheck
run build
document release checklist
define local review path before real Threads credentials
block release if checks fail
```

Iteration:

- 2026-03-13: Added demo mode because dashboard review was blocked on missing Supabase, AI, Telegram, and Threads credentials.

Todo List:

- `[x]` `PT-23` observability and audit trail — agent: Codex
- `[x]` `PT-24` CI and release gate — agent: Codex

Iteration:

- Pending feedback.

Todo List:

- `[ ]` `PT-23` logging and audit — agent: Codex
- `[ ]` `PT-24` CI and release gate — agent: Codex
