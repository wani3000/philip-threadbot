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

Iteration:

- 2026-03-13: GitHub `main` -> Vercel production auto deployment was verified end-to-end after setting per-project `rootDirectory`.
- 2026-03-13: `apps/web` Vercel build initially failed because public Supabase envs were unset; web deployment now uses explicit env gating and clearer login-state messaging.

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

## PT-25 관리자 인증 고도화

Subtasks:

- `PT-26` `[BE] Supabase 세션 기반 관리자 인증 연동` — executable now
- `PT-27` `[FE] 로그인·로그아웃 흐름 및 보호 경로 정리` — executable now

Approach:

- Replace the machine-token-only dashboard bridge with Supabase session auth wherever a real session is available.
- Keep demo mode untouched so local review without credentials is still possible.

Implementation plan:

`PT-26`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/lib/admin.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/lib/supabase/server.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/lib/api.ts`
- Pseudocode:

```text
create server supabase client from cookies
read access token from session
forward session token to API instead of fixed bearer token
fallback to demo token when local demo mode is enabled
```

`PT-27`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/login/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/actions.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/middleware.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/components/app-shell.tsx`
- Pseudocode:

```text
add login form and logout action
refresh session in middleware
redirect unauthenticated or non-admin users to login
show current auth mode in the shell
```

Iteration:

- 2026-03-13: Added this task after launch-readiness work because the remaining non-credential gap was the dashboard auth bridge.

Todo List:

- `[x]` `PT-26` session token forwarding and admin auth integration — agent: Codex
- `[x]` `PT-27` login/logout flow and route protection — agent: Codex

## PT-29 원재료 카테고리 구조 정합성 반영

Subtasks:

- `PT-28` `[DB] 원재료 카테고리 enum·마이그레이션·데모 데이터 정합성 반영` — executable now

Approach:

- Treat `/Users/chulwan/Downloads/philip_content_database.docx` as the canonical source for profile material categories.
- Update schema, validation, demo data, and dashboard labels together so category drift does not reappear later.
- Support both fresh bootstrap and existing seeded databases with an explicit migration path.

Implementation plan:

`PT-28`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/migrations/0001_initial.sql`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/migrations/0003_profile_category_restructure.sql`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/supabase/seed.sql`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/profile-material/categories.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/validation/profile-material.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/types.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/posts.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/demo-store.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/lib/profile-categories.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/profile/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/library/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/docs/db-schema.md`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/README.md`
- Pseudocode:

```text
replace legacy category enum with 6 canonical buckets
map existing values during migration:
  teaching + online_course -> teaching_mentoring
  insight -> designer_insight
  business -> startup_story
rewrite posts.source_snapshot.category for historical drafts
align API validation and draft regeneration types
align dashboard category options and labels
seed demo data across all 6 categories
```

- Constraints:
  - Preserve local demo mode.
  - Keep Korean labels identical to the source document.
  - Avoid losing historical post-category context during migration.

Iteration:

- 2026-03-13: `philip_content_database.docx` was adopted as the canonical category source for DB and dashboard structure.

Todo List:

- `[x]` `PT-28` category schema alignment and migration safety — agent: Codex

## PT-33 운영 필수 기능 보완

Subtasks:

- `PT-35` `[FE] 알림 설정 화면 구현` — executable now
- `PT-36` `[BE] Threads 연결 상태 조회 및 진단 API 구현` — executable now
- `PT-37` `[FE] Threads 연결 설정 화면 구현` — executable now
- `PT-38` `[FE] 글 라이브러리 검색·필터 구현` — executable now

Approach:

- Fill the remaining admin-operability gaps from the planning document before moving to stretch UX work.
- Reuse the existing `ai_settings` contract rather than splitting persistence too early.
- Keep Threads diagnostics read-only and safe while still exposing enough detail for operations.

Implementation plan:

`PT-35`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/settings/notification/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/actions.ts`
- Pseudocode:

```text
read current ai_settings
render notification-only fields
merge notification edits back into ai_settings update call
```

`PT-36`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/integrations/threads.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/threads/client.ts`
- Pseudocode:

```text
check oauth env presence
check token/user id presence
if token exists, call /me and return profile summary
respond with safe diagnostic payload for admin dashboard
```

`PT-37`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/settings/threads/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/lib/api.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/components/app-shell.tsx`
- Pseudocode:

```text
fetch threads status server-side
show connection summary, account info, and re-connect link
surface any configuration or token errors
```

`PT-38`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/library/page.tsx`
- Pseudocode:

```text
read searchParams
filter loaded posts by keyword/status/category/model
render filter form with query params
show empty state when no result matches
```

Iteration:

- 2026-03-13: Added `/settings/notification`, `/settings/threads`, Threads status diagnostics, and library query filtering to cover the remaining MVP admin gaps from the planning document.

Todo List:

- `[x]` `PT-35` notification settings screen — agent: Codex
- `[x]` `PT-36` Threads status diagnostics API — agent: Codex
- `[x]` `PT-37` Threads settings screen — agent: Codex
- `[x]` `PT-38` library search and filtering — agent: Codex

## PT-34 운영 확장 기능 및 분석 고도화

Subtasks:

- `PT-39` `[UI] 월간 캘린더 및 드래그앤드롭 일정 조정 구현` — 후순위
- `PT-40` `[BE] Threads 인사이트 수집 및 저장 구현` — 후순위
- `PT-41` `[FE] 홈 성과 요약 및 원재료 차트 고도화` — 후순위
- `PT-42` `[FE] 라이브러리 재사용 액션 및 확장 운영 기능 보강` — 후순위

Approach:

- Treat this group as post-MVP operational polish after real Supabase login and live analytics are available.
