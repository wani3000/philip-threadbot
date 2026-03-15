# Philip Threadbot

Philip Threadbot is an admin-operated automation system that turns Philip Designer's experience, lecture topics, and project history into reviewable Threads drafts, daily Telegram bot notifications, and scheduled Threads publishing. The business goal is to convert consistent personal-brand content into lecture inquiries and design project leads.

## Current Context

Initial setup and the MVP admin surface are now in place. The repository started empty, and the current baseline now covers the dashboard, API, demo-mode local runtime, a multi-post thread prompt pipeline, Telegram preview flow, GitHub-to-Vercel automatic deployment for both `web` and `api`, a live Supabase-backed production path, and a production-verified end-to-end flow from draft generation to Telegram preview to real Threads publishing. The current operating policy is intentionally low-cost: one connected thread every two days, fixed theme rotation, recent-material avoidance, and local duplicate rejection without extra LLM validation calls.

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
- Stage 2 converts the text into Philip's voice: polite tone, first-person project experience, designer vocabulary, concrete numbers or outcomes, and explicit anonymization of company or institution names into descriptive categories.
- Stage 3 optimizes the output for Threads as a 2 to 3 post connected thread with a hook on the first line, intentional line breaks, a per-post 500 character ceiling, and 3 to 5 hashtags on the final post.
- Draft themes rotate in a fixed 7-topic order, and the low-cost guardrail is to reject near-duplicate drafts locally instead of paying for an extra model-side critique or retry pass.
- Reference source: [juliuschun/simon-writing](https://github.com/juliuschun/simon-writing)

## Agent Ownership

- Active agent: Codex
- Current representative task: 기획 문서 재검증 후 운영 보완
- Next assigned agent: 미정
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
  - `PT-35` `[FE] 알림 설정 화면 구현`
  - `PT-36` `[BE] Threads 연결 상태 조회 및 진단 API 구현`
  - `PT-37` `[FE] Threads 연결 설정 화면 구현`
  - `PT-38` `[FE] 글 라이브러리 검색·필터 구현`
  - `PT-48` `[BE] 운영 준비 상태 진단 API 및 홈 표시 구현`
  - `PT-45` `[INFRA] API Supabase 실DB 연결 및 demo mode 해제`
  - `PT-43` `[INFRA] Supabase·Google 실로그인 자격증명 연결 및 활성화`
  - `PT-46` `[INFRA] LLM provider 키 연결 및 실초안 생성 검증`
  - `PT-47` `[INFRA] 실운영 cron·텔레그램·Threads end-to-end 검증`
  - `PT-50` `[BE] 초기 설정 미존재 시 기본 AI 설정 자동 생성`
  - `PT-51` `[DB] 필립 원재료 30+건 적재용 구조화 시드 준비`
  - `PT-52` `[INFRA] Google 실제 로그인 및 운영 전환 최종 체크리스트 검증`
  - `PT-53` `[BE] Threads 500자 제한 후처리 보강 및 실발행 재검증`
  - `PT-55` `[BE] 이어쓰기형 Threads 생성·저장·게시 파이프라인 구현`
  - `PT-56` `[BE] 전면 코드 검토 및 리팩토링`
  - `PT-57` `[BE] Threads reply 게시 재시도 및 부분 성공 상태 저장 보강`
  - `PT-39` `[UI] 월간 캘린더 및 드래그앤드롭 일정 조정 구현`
  - `PT-40` `[BE] Threads 인사이트 수집 및 저장 구현`
  - `PT-41` `[FE] 홈 성과 요약 및 원재료 차트 고도화`
  - `PT-42` `[FE] 라이브러리 재사용 액션 및 확장 운영 기능 보강`
- Next planned executable task: `PT-58` Threads 인사이트 마이그레이션 적용 및 live sync 검증

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
  - dedicated notification settings page and Threads connection status page
  - Threads status diagnostic API backed by live profile lookup
  - operations-readiness diagnostic API and home dashboard status panel
  - library search and query-based filtering
  - three-stage draft prompt strategy based on `simon-writing` -> Philip voice -> Threads optimization
  - multi-post thread generation with explicit segment storage and `---`-based editor serialization
  - structured request logging, request IDs, centralized error envelopes, and recent audit log surface
  - first-run default `ai_settings` auto-bootstrap when the table is empty
  - structured Philip content seed JSON plus bulk import script for 30+ production-ready source materials
  - local demo mode that works without Supabase, AI keys, Telegram token, or Threads credentials
  - GitHub Actions CI and release checklist docs
  - Supabase 세션 기반 로그인 페이지, 로그아웃 액션, 미들웨어 세션 갱신, 서버 액션 토큰 전달 연동
  - cron runner implementation for daily draft generation, Telegram preview delivery, and scheduled Threads publish
  - Vercel cron-compatible auth support and daily UTC cron schedule config
  - live Supabase migration application and production database seeding with 49 source-material rows
  - production Google sign-in verification with the real admin account
  - live Anthropic draft generation verification
  - end-to-end production validation for draft generation, Telegram preview, and real Threads publishing
  - Threads 500-character publish-safety enforcement in draft finalization
  - threaded publish stabilization with reply publish retries and shared thread preview rendering on web surfaces
  - monthly drag-and-drop calendar board for schedule movement
  - Threads insights summary/sync endpoints and dashboard/library consumption
- library reuse actions for cloning a post into a new draft or the next 2-day cadence slot
- 7-theme fixed rotation for content generation
- every-other-day publish cadence enforced at generation time, library reuse time, and publish time
- recent-material exclusion plus local duplicate detection without extra LLM validation calls
- next-scheduled dashboard card and Telegram preview flow aligned to the same “closest upcoming post” rule
- Next executable tasks:
  - 없음

## Deployment Status

- GitHub remote: `wani3000/philip-threadbot`
- Production branch: `main`
- Git push now triggers Vercel production deployments for both projects
- Web: [https://philip-threadbot-web.vercel.app](https://philip-threadbot-web.vercel.app)
- API: [https://philip-threadbot-api.vercel.app](https://philip-threadbot-api.vercel.app)
- Current production status:
  - API production is running in `live` mode with Supabase attached
  - Google sign-in has been verified with the real admin account
  - Anthropic live draft generation has been verified
  - Telegram preview delivery has been verified
  - Threads real publishing has been verified
  - Threads account-level insight snapshots are now syncing in production
  - Threaded published posts now persist `insights_media_ids` and sync per-post snapshots through the insight-friendly media IDs
  - One older single-post publish may still show zero per-post metrics because Threads does not return an alternative media insights identifier for that legacy post

## UI Approval Queue

- 없음

## 🔄 인계 요약 (다음 에이전트 필독)

- 마지막 완료 작업: 다음 게시 예정 대시보드·텔레그램 정합성 보강
- 다음 작업: 없음
- 주의사항: GitHub -> Vercel 자동 배포는 정상입니다. 현재 운영 규칙은 `2일 1회 게시`, `7개 주제 순환`, `최근 원재료 제외`, `로컬 중복 검사`, `중복 시 자동 재생성 없음`입니다. 홈의 `다음 게시 예정` 카드와 텔레그램 미리보기는 모두 같은 “가장 가까운 예약 글” 기준으로 동작합니다. live insights는 account-level과 threaded post-level까지 검증되었습니다. 다만 과거 단일 게시물 1건은 Threads API가 insight-friendly media ID를 주지 않아 per-post 수치가 0으로 남을 수 있습니다.
- UI 승인 대기: 없음
- 참고: `plan.md` Iteration 섹션에 상세 인계 메모 있음

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
- 생성 규칙은 `7개 주제 순환`, `특정 회사명 실명 금지`, `최근 원재료 제외`, `로컬 중복 검사`로 고정되어 있습니다.
- 운영 cadence는 `2일 1회 게시`이며, 수동 복제와 실제 게시 단계에서도 같은 규칙을 강제합니다.
- Threads 자격증명은 연결되었고 실제 게시 검증도 끝났습니다.
- Supabase production 연결과 실DB 마이그레이션도 완료되었습니다.
- Google 실로그인, Anthropic 실초안 생성, Telegram 전송, Threads 실게시까지 모두 검증 완료되었습니다.
- Threads account-level insight sync도 production에서 검증 완료되었습니다.
- Threaded published post의 insight media ID 추적 구조도 production에서 검증 완료되었습니다.
- 현재 남은 실제 작업은 없습니다.

## Commit Convention

Format:

`[대표이슈-번호/하위이슈-번호] 타입: 작업 내용 요약`

Example:

`[PT-1/PT-7] feat: bootstrap monorepo workspace`
