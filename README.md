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
  - `PT-15` `[INFRA] Implement scheduled jobs for nightly generation and morning Telegram notifications`
- Next planned executable task: `PT-17` `[BE] Integrate draft notification Telegram bot delivery`

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
- Next executable tasks:
  - `PT-17` Telegram bot delivery
  - `PT-18` Threads publishing workflow
  - `PT-13` AI provider abstraction

## UI Approval Queue

- `PT-21` `[UI] Build home dashboard layout and tomorrow-post review surface`
- `PT-22` `[UI] Build profile management, calendar, and library screens`

These tasks remain locked until developer approval.

## Reference Files

- `research.md`
  - Detailed state-of-codebase analysis, architecture notes, layer boundaries, and gaps.
- `plan.md`
  - Jira-mapped execution document with implementation notes, pseudocode, and todo state.
- `docs/db-schema.md`
  - First-pass data model, lifecycle states, indexing strategy, and operational schema notes.
- `docs/deployment.md`
  - Deployment split, environment ownership, cron contracts, and security rules.

## Commit Convention

Format:

`[대표이슈-번호/하위이슈-번호] 타입: 작업 내용 요약`

Example:

`[PT-1/PT-7] feat: bootstrap monorepo workspace`
