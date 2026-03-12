# Philip Threadbot

Philip Threadbot is an admin-operated automation system that turns Philip Designer's experience, lecture topics, and project history into reviewable Threads drafts, daily Telegram bot notifications, and scheduled Threads publishing. The business goal is to convert consistent personal-brand content into lecture inquiries and design project leads.

## Current Context

Initial setup is now in progress. The repository started empty, so the current focus is establishing project structure, execution docs, Jira hierarchy, and the first non-UI infrastructure tasks.

## Core Directory Structure

- `apps/web` — Next.js dashboard shell and future admin routes
- `apps/api` — Express API shell, cron entrypoints, and backend integrations
- `research.md` — current repository and architecture analysis
- `plan.md` — Jira-aligned execution plan and task-by-task implementation notes

## Tech Stack

- Next.js 14 App Router
- Node.js + Express
- TypeScript
- npm workspaces
- Planned: Supabase, Telegram Bot API, Claude/OpenAI/Gemini, Threads Graph API

## Prompt Strategy

- Draft generation now uses a fixed three-stage prompt pipeline.
- Stage 1 injects a `simon-writing`-inspired writing contract so the post starts from a scene or observation, delays the insight until the end, alternates sentence rhythm, and uses one structural metaphor.
- Stage 2 converts the text into Philip's voice: polite tone, first-person project experience, designer vocabulary, and concrete numbers or outcomes.
- Stage 3 optimizes the output for Threads with a hook on the first line, intentional line breaks, about 500 characters, and 3 to 5 hashtags.
- Reference source: [juliuschun/simon-writing](https://github.com/juliuschun/simon-writing)

## Agent Ownership

- Active agent: Codex
- Current representative task: `PT-2` Data model and authentication foundation
- Completed subtasks:
  - `PT-7` `[INFRA] Initialize monorepo workspace and baseline tooling`
  - `PT-8` `[INFRA] Set up environment variable strategy and example files`
  - `PT-9` `[INFRA] Establish deployment targets and cron entrypoint conventions`
  - `PT-10` `[DB] Design initial Supabase schema and migration plan`
  - `PT-11` `[DB] Implement database bootstrap migrations and seed strategy`
  - `PT-12` `[BE] Implement admin authentication boundary`
  - `PT-13` `[BE] Claude, OpenAI, Gemini용 AI 제공자 추상화 구현`
  - `PT-14` `[BE] 프로필 원재료 기반 초안 생성 파이프라인 구현`
  - `PT-15` `[INFRA] Implement scheduled jobs for nightly generation and morning Telegram notifications`
  - `PT-16` `[FE] 모델 선택 및 재생성용 비시각 로직 구현`
  - `PT-17` `[BE] Integrate draft notification Telegram bot delivery`
  - `PT-18` `[BE] Implement Threads OAuth and publishing workflow`
  - `PT-19` `[BE] 프로필 원재료 CRUD API 및 검증 구현`
  - `PT-20` `[FE] 초안 검토 및 스케줄 운영 데이터 흐름 구현`
  - `PT-21` `[UI] 홈 대시보드 및 내일 게시 예정 검토 화면 구성`
  - `PT-22` `[UI] 프로필 관리, 캘린더, 라이브러리 화면 구성`
- Next planned executable task: `PT-23` `[BE] Add structured logging, error handling, and audit trails`

## Work Status

- Completed in repo:
  - initial documentation bootstrap
  - Jira task hierarchy creation
  - monorepo workspace baseline
  - environment variable contract and API startup validation
  - first-pass database schema PRD
  - initial Supabase migration and seed files
  - admin auth boundary scaffold for API and protected dashboard paths
  - deployment notes and protected cron endpoint scaffold
  - `job_runs`-based cron runner and idempotent run-key flow
  - Telegram bot client, preview formatter, and protected admin test endpoint
  - Threads OAuth/publish client and integration test routes
  - AI provider abstraction, draft generation endpoint, and profile material CRUD APIs
  - dashboard pages for overview, profile materials, calendar, library, and AI settings
  - three-stage draft prompt strategy based on `simon-writing` -> Philip voice -> Threads optimization
- Next executable tasks:
  - `PT-23` structured logging and audit trail
  - `PT-24` CI and release gate
  - later auth hardening to replace bootstrap `ADMIN_BEARER_TOKEN` bridge

## UI Approval Queue

- None. `PT-21` and `PT-22` were approved and implemented.

## Reference Files

- `research.md`
  - Detailed state-of-codebase analysis, architecture notes, layer boundaries, and gaps.
- `plan.md`
  - Jira-mapped execution document with implementation notes, pseudocode, and todo state.
- `docs/db-schema.md`
  - First-pass data model, lifecycle states, indexing strategy, and operational schema notes.
- `docs/deployment.md`
  - Deployment split, environment ownership, cron contracts, and security rules.

## Runtime Note

The current web dashboard uses server actions that call the API with `ADMIN_BEARER_TOKEN` on the server side. This is a bootstrap bridge until full browser-to-session auth wiring is added.

## Commit Convention

Format:

`[대표이슈-번호/하위이슈-번호] 타입: 작업 내용 요약`

Example:

`[PT-1/PT-7] feat: bootstrap monorepo workspace`
