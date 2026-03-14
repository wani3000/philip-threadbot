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

- `PT-39` `[UI] 월간 캘린더 및 드래그앤드롭 일정 조정 구현` — done
- `PT-40` `[BE] Threads 인사이트 수집 및 저장 구현` — done
- `PT-41` `[FE] 홈 성과 요약 및 원재료 차트 고도화` — done
- `PT-42` `[FE] 라이브러리 재사용 액션 및 확장 운영 기능 보강` — done
- `PT-58` `[INFRA] Threads 인사이트 마이그레이션 적용 및 live sync 검증` — pending

Approach:

- Treat this group as post-MVP operational polish after real Supabase login and live analytics are available.

Iteration:

- 2026-03-13 handoff: keep this task group in `To Do`. Recommended execution order is `PT-40` -> `PT-41` -> `PT-42` -> `PT-39` so metrics/data shape lands before dashboard polish and the calendar UI comes last.
- 2026-03-14:
  - `PT-40` implemented the insight snapshot schema, Threads insights summary/sync endpoints, and graceful empty fallback when the tables are not present yet.
  - `PT-41` added home performance cards, top-post ranking, and category-level bars driven by insight summary data.
  - `PT-42` added library reuse actions (`새 초안으로 재사용`, `내일 일정으로 복제`) plus per-post insight snippets and direct Threads post links.
  - `PT-39` replaced the simple list calendar with a monthly board and drag-and-drop schedule movement flow.
  - Because the new Supabase migration has not been applied in production yet, the live sync activation step was split out as `PT-58`.

Todo List:

- `[x]` `PT-39` monthly calendar and drag-and-drop rescheduling — agent: Codex
- `[x]` `PT-40` Threads insights ingestion and storage — agent: Codex
- `[x]` `PT-41` home analytics summary and material charts — agent: Codex
- `[x]` `PT-42` library reuse actions and extended operations tools — agent: Codex
- `[ ]` `PT-58` apply insights migration and verify live sync — next agent

## PT-30 Vercel 무료 배포 및 Google 로그인 준비

Subtasks:

- `PT-31` `[FE] Google OAuth 로그인 버튼·콜백 흐름 추가` — done
- `PT-32` `[INFRA] Vercel 무료 배포 구성 및 도메인 연결` — done
- `PT-43` `[INFRA] Supabase·Google 실로그인 자격증명 연결 및 활성화` — done
- `PT-45` `[INFRA] API Supabase 실DB 연결 및 demo mode 해제` — done
- `PT-46` `[INFRA] LLM provider 키 연결 및 실초안 생성 검증` — done
- `PT-47` `[INFRA] 실운영 cron·텔레그램·Threads end-to-end 검증` — done

Approach:

- The deployment and login code paths are already in place.
- Remaining work is now almost entirely credential wiring and environment validation.

Iteration:

- 2026-03-13 handoff:
  - Completed: GitHub -> Vercel auto deployment, Google OAuth UI/callback code, safe login fallback when Supabase env is missing.
  - Pending: attach live Supabase URL/anon key, configure Google provider in Supabase, verify allowed admin email, and test `/login` end-to-end in production.
  - Current blocker is external credentials rather than application code.
  - Next agent should start with `PT-45` and `PT-43` before any PT-34 expansion work if real launch is the priority.
  - UI 승인 대기 이슈 목록: 없음
- 2026-03-13 final readiness review:
  - Production API `GET /health` now reports `mode: live`.
  - Vercel API and web Supabase env wiring is complete, and the new Supabase project migrations are applied.
  - Google sign-in, Anthropic live draft generation, Telegram delivery, and Threads live publishing have all now been verified.
  - PT-30 is complete. Remaining work has moved to PT-34 expansion items.

Todo List:

- `[x]` `PT-31` Google OAuth button and callback flow — agent: Codex
- `[x]` `PT-32` Vercel deployment configuration and domains — agent: Codex
- `[x]` `PT-43` Supabase and Google live credential activation — agent: Codex
- `[x]` `PT-45` API live Supabase connection and demo-mode exit — agent: Codex
- `[x]` `PT-46` LLM provider key hookup and live draft verification — agent: Codex
- `[x]` `PT-47` production cron, Telegram, and Threads end-to-end verification — agent: Codex

## PT-44 운영 시작 전환 마감

Subtasks:

- `PT-48` `[BE] 운영 준비 상태 진단 API 및 홈 표시 구현` — done

Approach:

- Make launch blockers visible in-product so environment wiring can be validated without digging through Vercel or logs.
- Separate code-complete items from credential-blocked items and expose them as structured readiness checks.

Implementation plan:

`PT-48`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/operations/readiness.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/index.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/lib/api.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/globals.css`
- Pseudocode:

```text
check demo/live mode
check required env groups for Supabase, LLM, cron, Telegram, Threads
verify Telegram bot with getMe
verify Threads token with /me
return blocked/warning/ready payload
render the checks on the dashboard home screen
```

Iteration:

- 2026-03-13: Added `/admin/readiness` and a home dashboard panel that clearly surfaces the real launch blockers in production.

Todo List:

- `[x]` `PT-48` readiness diagnostics API and dashboard visibility — agent: Codex

## PT-49 기획 문서 재검증 후 운영 보완

Subtasks:

- `PT-50` `[BE] 초기 설정 미존재 시 기본 AI 설정 자동 생성` — executable now
- `PT-51` `[DB] 필립 원재료 30+건 적재용 구조화 시드 준비` — executable now
- `PT-52` `[INFRA] Google 실제 로그인 및 운영 전환 최종 체크리스트 검증` — done
- `PT-53` `[BE] Threads 500자 제한 후처리 보강 및 실발행 재검증` — done

Approach:

- Re-read both source planning documents and compare them against the live implementation rather than the earlier bootstrap assumptions.
- Close operational gaps that would cause first-run failures even when the codebase itself is otherwise feature-complete.
- Treat structured source-material loading as launch preparation, not optional sample data.

Implementation plan:

`PT-50`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/ai-settings/defaults.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/routes/ai-settings.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/store.ts`
- Pseudocode:

```text
build repository-owned default ai_settings payload
when GET /ai-settings finds no row, insert defaults and return it
when draft pipeline needs ai_settings and table is empty, auto-create defaults
```

`PT-51`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/docs/philip-content-seed.json`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/scripts/import-philip-content.mjs`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/package.json`
- Pseudocode:

```text
convert philip_content_database.docx into structured JSON rows
preserve the fixed six category taxonomy from the product plan
query existing titles in Supabase
insert only missing rows and report inserted/skipped counts
```

`PT-52`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/README.md`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/research.md`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/plan.md`
- Pseudocode:

```text
verify Google sign-in with the real admin account
confirm readiness panel reflects live infra accurately
run final cron and Threads validation after LLM credits are available
record final launch blockers in docs and Jira
```

`PT-53`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/prompt.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/index.ts`
- Pseudocode:

```text
normalize/extract hashtags
enforce max 500 characters in finalize step
preserve 3 to 5 hashtags
truncate body safely without breaking the Threads publish contract
rerun generate -> telegram -> publish validation
```

Iteration:

- 2026-03-13:
  - Re-read `philip_threads_system_plan.docx` and `philip_content_database.docx`.
  - Identified two launch-critical gaps not covered by the earlier implementation pass:
    - empty `ai_settings` caused first-run friction in live Supabase
    - the full Philip content library from the planning database had not been structured or importable yet
  - Added auto-bootstrap for `ai_settings` and a structured JSON + import script for production source materials.
  - Applied the new Supabase project migrations and imported 49 total source-material rows, with the bulk import script inserting 43 additional unique rows after skipping 2 title overlaps.
  - After Anthropic credits were restored, live draft generation was verified successfully.
  - During end-to-end publish validation, a real Threads API `500 characters max` failure surfaced; PT-53 was created, implemented, and revalidated successfully.

Todo List:

- `[x]` `PT-50` default AI settings auto-bootstrap — agent: Codex
- `[x]` `PT-51` structured Philip content seed and import tooling — agent: Codex
- `[x]` `PT-52` Google live sign-in and final launch checklist verification — agent: Codex
- `[x]` `PT-53` Threads 500-char post-finalization safeguard and republish verification — agent: Codex

## PT-54 이어쓰기형 Threads 생성 최적화 및 코드 리팩토링

Subtasks:

- `PT-55` `[BE] 이어쓰기형 Threads 생성·저장·게시 파이프라인 구현` — done
- `PT-56` `[BE] 전면 코드 검토 및 리팩토링` — done
- `PT-57` `[BE] Threads reply 게시 재시도 및 부분 성공 상태 저장 보강` — done

Approach:

- Shift from single-post generation to a cost-efficient multi-post thread workflow so one LLM call can produce 2 to 3 connected posts.
- Persist thread segments explicitly so the dashboard, Telegram preview, and publish job all operate on the same serialized structure.
- Stabilize live publishing by treating reply publish propagation delays as a first-class retry case rather than a generic failure.
- Use this pass to remove obvious duplicated thread-preview rendering in the web layer and improve error typing in the Threads client.

Implementation plan:

`PT-55`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/prompt.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/index.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/draft-pipeline/store.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/thread-content.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/telegram/templates.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/jobs/runner.ts`
- Pseudocode:

```text
ask model for 2~3 posts separated by a sentinel token
normalize into segments and persist them in generation_notes.thread_segments
serialize the editor-friendly body with --- separators
send Telegram previews as numbered thread segments
publish the root post and then publish replies in order
```

`PT-56`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/components/thread-preview.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/library/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/web/app/calendar/page.tsx`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/threads/client.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/jobs/runner.ts`
- Pseudocode:

```text
extract repeated thread preview rendering into one component
introduce a typed ThreadsApiError for status/payload-aware retry logic
dedupe repeated post select fields in the publish runner
keep behavior unchanged outside the threaded publish path
```

`PT-57`

- Files:
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/jobs/runner.ts`
  - `/Users/chulwan/Documents/GitHub/designer_threadbot/apps/api/src/lib/threads/client.ts`
- Pseudocode:

```text
detect Threads "resource not found" propagation failures by code/subcode
retry reply publish with a short settling delay before the first publish attempt
preserve partial root/reply publish payloads in publish_attempts when a later reply fails
rerun generate -> telegram -> publish against live infra and confirm reply_chain_count > 1
```

Iteration:

- 2026-03-14:
  - First live threaded publish attempt proved that generation and Telegram preview already worked, but reply posts failed because Threads could not immediately publish a freshly created reply container.
  - A direct API experiment showed the failure was not `reply_to_id` itself. The unstable step was `threads_publish` on reply containers right after creation.
  - Introduced typed Threads API errors, propagation-aware retry logic for reply publish, and partial result persistence in `publish_attempts`.
  - Refactored web thread previews into a shared component and revalidated the full live flow.
  - Final live verification succeeded for:
    - draft generation
    - Telegram preview
    - Threads root + reply chain publish

Todo List:

- `[x]` `PT-55` threaded Threads generation, storage, and publishing pipeline — agent: Codex
- `[x]` `PT-56` code review and refactoring pass — agent: Codex
- `[x]` `PT-57` reply publish retry and partial-success persistence — agent: Codex

## Handoff Note

Iteration:

- 내가 완료한 작업 요약:
  - `PT-35` 알림 설정 전용 화면 추가
  - `PT-36` Threads 연결 상태 진단 API 추가
  - `PT-37` Threads 연결 설정 화면 추가
  - `PT-38` 라이브러리 검색·필터 추가
  - `PT-48` 운영 준비 상태 진단 API 및 홈 표시 추가
  - `PT-45` Supabase 실DB 연결 및 production live mode 전환
  - `PT-50` 기본 AI 설정 자동 생성 경로 추가
  - `PT-51` 필립 원재료 49건 적재용 구조화 시드/임포트 경로 준비
  - `PT-43` Google 실제 로그인 검증 완료
  - `PT-46` Anthropic 실초안 생성 검증 완료
  - `PT-47` generate -> telegram -> Threads 실운영 end-to-end 검증 완료
  - `PT-52` 운영 전환 최종 체크리스트 완료
  - `PT-53` Threads 500자 제한 후처리 보강 및 재검증 완료
  - `PT-55` 이어쓰기형 Threads 생성·저장·게시 파이프라인 구현 완료
  - `PT-56` 전면 코드 검토 및 thread preview 리팩토링 완료
  - `PT-57` Threads reply publish 재시도 보강 및 라이브 재검증 완료
- 미완료 작업 및 현재 상태:
  - `PT-39`~`PT-42`는 후순위 확장 기능으로 모두 `To Do`입니다.
- 작업 중 발견한 이슈나 주의사항:
  - `web` Vercel 프로젝트에는 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 없으면 로그인은 비활성화되지만 화면은 깨지지 않습니다.
  - 이어쓰기 글은 `generation_notes.thread_segments`와 `generated_content/edited_content`의 `---` 구분선 두 경로 모두에서 복원됩니다.
  - Threads live publish는 reply container 생성 직후 바로 publish하면 실패할 수 있어, 현재는 reply publish 전에 짧은 안정화 대기와 조건부 재시도가 들어가 있습니다.
  - Threads 진단은 `/integrations/threads/status`와 `/settings/threads`에서 가장 빠르게 확인할 수 있습니다.
  - 운영 전환 전체 상태는 홈의 운영 준비 상태 카드와 `/admin/readiness`에서 가장 빠르게 확인할 수 있습니다.
  - GitHub push -> Vercel 자동 배포는 현재 정상입니다.
  - `ai_settings` 테이블이 비어 있어도 이제 API가 기본 설정을 자동 생성합니다.
  - 새 Supabase 프로젝트에는 Philip 원재료가 총 49건 적재되어 있습니다.
- 다음으로 처리해야 할 하위 태스크 번호 및 순서:
  - `PT-40`
  - `PT-41`
  - `PT-42`
  - `PT-39`
- 막히거나 판단이 필요한 부분:
  - 운영 필수 범위는 종료되었고, 이제는 PT-34 확장 작업만 남았습니다.
- UI 승인 대기 중인 이슈 목록:
  - 없음
