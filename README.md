# Philip Threadbot

Philip Threadbot is an admin-operated automation system that turns Philip Designer's experience, lecture topics, and project history into reviewable Threads drafts, daily Telegram bot notifications, and scheduled Threads publishing. The business goal is to convert consistent personal-brand content into lecture inquiries and design project leads.

## Current Context

Initial setup and the MVP admin surface are now in place. The repository started empty, and the current baseline now covers the dashboard, API, demo-mode local runtime, prompt pipeline, Telegram preview flow, pre-launch quality gates, and GitHub-to-Vercel automatic deployment for both `web` and `api`.

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
- Supabase, Telegram Bot API, Claude/OpenAI/Gemini, Threads Graph API
- GitHub Actions CI
- Local demo mode for pre-credential review

## Prompt Strategy

- Draft generation now uses a fixed three-stage prompt pipeline.
- Stage 1 injects a `simon-writing`-inspired writing contract so the post starts from a scene or observation, delays the insight until the end, alternates sentence rhythm, and uses one structural metaphor.
- Stage 2 converts the text into Philip's voice: polite tone, first-person project experience, designer vocabulary, and concrete numbers or outcomes.
- Stage 3 optimizes the output for Threads with a hook on the first line, intentional line breaks, about 500 characters, and 3 to 5 hashtags.
- Reference source: [juliuschun/simon-writing](https://github.com/juliuschun/simon-writing)

## Agent Ownership

- Active agent: Codex
- Current representative task: `PT-30` Vercel 무료 배포 및 Google 로그인 준비
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
  - `PT-23` `[BE] 구조화 로그, 에러 처리, 감사 로그 구현`
  - `PT-24` `[INFRA] 테스트 전략, CI 체크, 릴리즈 게이트 정의`
  - `PT-26` `[BE] Supabase 세션 기반 관리자 인증 연동`
  - `PT-27` `[FE] 로그인·로그아웃 흐름 및 보호 경로 정리`
  - `PT-28` `[DB] 원재료 카테고리 enum·마이그레이션·데모 데이터 정합성 반영`
- Next planned executable task: Supabase 실프로젝트 연결 및 Google 로그인 활성화

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
  - live Threads deauthorize/delete callback endpoints
  - AI provider abstraction, draft generation endpoint, and profile material CRUD APIs
  - dashboard pages for overview, profile materials, calendar, library, and AI settings
  - three-stage draft prompt strategy based on `simon-writing` -> Philip voice -> Threads optimization
  - structured request logging, request IDs, centralized error envelopes, and recent audit log surface
  - local demo mode that works without Supabase, AI keys, Telegram token, or Threads credentials
  - GitHub Actions CI and release checklist docs
  - Supabase 세션 기반 로그인 페이지, 로그아웃 액션, 미들웨어 세션 갱신, 서버 액션 토큰 전달 연동
  - cron runner implementation for daily draft generation, Telegram preview delivery, and scheduled Threads publish
  - Vercel cron-compatible auth support and daily UTC cron schedule config
- Next executable tasks:
  - Supabase 실DB 연결로 예약 발행 상태 영속화
  - Vercel `web` 프로젝트에 Supabase 공개 환경변수 주입
  - Supabase Google provider 설정 및 허용 관리자 이메일 검증
  - 실운영 cron 검증
  - 운영 모드 전환

## Deployment Status

- GitHub remote: `wani3000/philip-threadbot`
- Production branch: `main`
- Git push now triggers Vercel production deployments for both projects
- Web: [https://philip-threadbot-web.vercel.app](https://philip-threadbot-web.vercel.app)
- API: [https://philip-threadbot-api.vercel.app](https://philip-threadbot-api.vercel.app)
- Current remaining external dependency for real login:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Google OAuth provider setup in Supabase

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
- `docs/release-checklist.md`
  - Pre-launch verification checklist before real Telegram and Threads credentials are attached.

## Runtime Note

The web dashboard now supports Supabase session login and forwards the session access token to the API on the server side. Local demo mode still keeps the `ADMIN_BEARER_TOKEN` fallback for credential-free review.

## Local Review Mode

- In local development, the API can run in demo mode without Supabase and external provider keys.
- Demo mode provides sample profile materials, sample scheduled posts, local auth via `ADMIN_BEARER_TOKEN`, simulated AI draft generation, simulated Telegram delivery, and recent audit log data.
- If `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are configured, Telegram delivery can be validated with real messages even while the rest of the stack stays in demo mode.
- Live mode에서는 `/login`에서 Supabase 관리자 계정으로 로그인하면 같은 세션으로 대시보드와 API가 연결됩니다.
- 프로필 원재료의 기준 카테고리는 `경력`, `프로젝트`, `창업스토리`, `강의멘토링`, `디자이너인사이트`, `바이브코딩` 여섯 가지로 고정되어 있습니다.
- This is the intended review state before real Threads credentials are supplied.

## Commit Convention

Format:

`[대표이슈-번호/하위이슈-번호] 타입: 작업 내용 요약`

Example:

`[PT-1/PT-7] feat: bootstrap monorepo workspace`
