# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

beads-sv is a multi-repository issue tracking UI for the [Beads](https://github.com/steveyegge/beads) issue tracking system. Built with SvelteKit 5 and Svelte 5, it provides a unified dashboard to manage issues across multiple git repositories from a single local web instance.

## Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev -- --open    # Dev server + open browser

# Build & Preview
npm run build            # Production build
npm run preview          # Preview production build

# Quality
npm run check            # Type checking (svelte-check)
npm run check:watch      # Type checking in watch mode
npm run lint             # Prettier + ESLint check
npm run format           # Auto-format with Prettier

# Testing
npm run test:unit        # Vitest unit tests (browser mode)
npm run test:e2e         # Playwright E2E tests
npm run test             # All tests (unit + e2e)
```

## Architecture

**REST + WebSocket hybrid pattern:**
- REST API (`/api/repos/*`) handles CRUD operations
- socket.io provides real-time file change events via chokidar file watching
- State managed with Svelte 5 runes (`$state`, `$derived`) + context API

**Key directories:**
```
src/lib/
├── server/services/     # Business logic (app-config, file-watcher, repo-validator)
├── server/parser/       # Markdown issue parser
├── state/               # Svelte 5 context stores (*.svelte.ts)
├── components/ui/       # shadcn-svelte primitives
└── types/               # TypeScript interfaces

src/routes/
├── api/repos/           # REST endpoints
└── repos/[repoId]/      # Per-repo views (issues, board, epics)
```

**Data storage:**
- `~/.beads-sv/config.json` - Managed repos list
- `/path/to/repo/.beads/issues/*.md` - Issue markdown files

## Tech Stack

- **Framework:** SvelteKit 5, Svelte 5 (runes syntax)
- **Styling:** Tailwind CSS 4
- **UI:** shadcn-svelte, Iconify
- **Real-time:** socket.io + chokidar
- **Testing:** Vitest (browser mode via Playwright), Playwright for E2E

## Code Style

- TypeScript strict mode
- Svelte 5 runes (`$state`, `$derived`, `$effect`) - no legacy lifecycle functions
- Context-based stores for state (`setContext`/`getContext`)
- Tabs, single quotes, 100-char line width (see `.prettierrc`)

## Testing

Unit tests use Vitest with browser mode:
- Component tests: `src/**/*.svelte.{test,spec}.ts`
- Server tests: `src/**/*.{test,spec}.ts`

E2E tests in `e2e/` run against the built production version.

## Issue Tracking

This project uses `bd` (beads CLI) for issue tracking. See AGENTS.md for workflow details. Key commands:
```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress
bd close <id>
bd sync               # Sync with git
```
