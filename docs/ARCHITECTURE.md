# beads-sv Architecture

Multi-repo beads issue tracker built with SvelteKit 5.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Sidebar   │  │   Header    │  │    Views    │              │
│  │  (repos)    │  │  (search)   │  │ List/Board  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Svelte 5 State (runes)                         ││
│  │  $state, $derived, context-based stores                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                    │                  │
│                     REST API            socket.io                │
└─────────────────────────────┼─────────────────┼─────────────────┘
                              │                 │
┌─────────────────────────────┼─────────────────┼─────────────────┐
│                        SvelteKit Server                          │
├─────────────────────────────┼─────────────────┼─────────────────┤
│  ┌─────────────────────────┐│  ┌─────────────────────────────┐  │
│  │    REST API Routes      ││  │    socket.io Server         │  │
│  │  /api/repos/*           ││  │  - Room per repo            │  │
│  │  /api/repos/[id]/issues ││  │  - File change events       │  │
│  └─────────────────────────┘│  └─────────────────────────────┘  │
│                              │                 │                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Services Layer                            ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       ││
│  │  │ App Config   │  │ Issue Parser │  │ File Watcher │       ││
│  │  │ Service      │  │ (markdown)   │  │ (chokidar)   │       ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                        File System                               │
├─────────────────────────────────────────────────────────────────┤
│  ~/.beads-sv/                    /path/to/repo-1/.beads/         │
│  └── config.json                 ├── config.json                 │
│      (managed repos)             ├── issues/                     │
│                                  │   ├── repo-1.md               │
│                                  │   └── repo-2.md               │
│                                  └── closed/                     │
│                                                                  │
│                                  /path/to/repo-2/.beads/         │
│                                  └── ...                         │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. REST API (CRUD Operations)

```
Client                    Server                    File System
  │                         │                           │
  │  POST /api/repos        │                           │
  │ ───────────────────────>│                           │
  │                         │  validate .beads dir      │
  │                         │ ─────────────────────────>│
  │                         │                           │
  │                         │  update ~/.beads-sv/config│
  │                         │ ─────────────────────────>│
  │                         │                           │
  │  { repo: {...} }        │                           │
  │ <───────────────────────│                           │
```

### 2. socket.io (Real-time Updates)

```
Client                    Server                    File System
  │                         │                           │
  │  socket.emit            │                           │
  │  ('repo:subscribe',     │                           │
  │   repoId)               │                           │
  │ ───────────────────────>│                           │
  │                         │  chokidar watches         │
  │                         │  .beads/issues/*.md       │
  │                         │ ─────────────────────────>│
  │                         │                           │
  │                         │     file changed          │
  │                         │ <─────────────────────────│
  │                         │                           │
  │  socket.on              │                           │
  │  ('issue:changed',      │                           │
  │   { issueId, type })    │                           │
  │ <───────────────────────│                           │
  │                         │                           │
  │  GET /api/repos/[id]/   │                           │
  │      issues/[issueId]   │  (client refetches)       │
  │ ───────────────────────>│                           │
```

## Directory Structure

```
beads-sv/
├── docs/
│   └── ARCHITECTURE.md          # This file
├── src/
│   ├── lib/
│   │   ├── types/
│   │   │   └── beads.ts         # TypeScript interfaces
│   │   ├── server/
│   │   │   ├── services/
│   │   │   │   ├── app-config.ts    # Repo list management
│   │   │   │   ├── repo-validator.ts # Validate .beads dirs
│   │   │   │   └── file-watcher.ts  # Chokidar wrapper
│   │   │   ├── parser/
│   │   │   │   └── issue-parser.ts  # Markdown <-> Issue
│   │   │   └── socket.ts            # socket.io server setup
│   │   ├── state/
│   │   │   ├── app.svelte.ts        # Global app state
│   │   │   ├── issues.svelte.ts     # Per-repo issue state
│   │   │   └── socket.svelte.ts     # socket.io client
│   │   └── components/
│   │       ├── ui/                  # shadcn-svelte components
│   │       ├── layout/              # Sidebar, Header, AppShell
│   │       ├── issues/              # IssueCard, IssueTable, etc.
│   │       ├── board/               # BoardColumn, BoardCard
│   │       ├── repos/               # RepoCard, AddRepoDialog
│   │       └── shared/              # Badges, icons, markdown
│   └── routes/
│       ├── +layout.svelte           # App shell
│       ├── +page.svelte             # Dashboard
│       ├── api/
│       │   └── repos/               # REST endpoints
│       └── repos/
│           └── [repoId]/            # Repo-specific views
├── .beads/                          # This project's issues
│   ├── config.json
│   └── issues/
└── package.json
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                      +layout.svelte                          │
│  ┌───────────────┐  ┌─────────────────────────────────────┐ │
│  │   Sidebar     │  │            Main Content              │ │
│  │               │  │  ┌─────────────────────────────────┐ │ │
│  │ ┌───────────┐ │  │  │           Header                │ │ │
│  │ │ RepoCard  │ │  │  │  Search | Breadcrumbs | Actions │ │ │
│  │ └───────────┘ │  │  └─────────────────────────────────┘ │ │
│  │ ┌───────────┐ │  │  ┌─────────────────────────────────┐ │ │
│  │ │ RepoCard  │ │  │  │           TabBar                │ │ │
│  │ └───────────┘ │  │  │   Issues | Board | Epics        │ │ │
│  │      ...      │  │  └─────────────────────────────────┘ │ │
│  │               │  │  ┌─────────────────────────────────┐ │ │
│  │ ┌───────────┐ │  │  │         View Content            │ │ │
│  │ │ Add Repo  │ │  │  │                                 │ │ │
│  │ │  Button   │ │  │  │  Issues: IssueTable             │ │ │
│  │ └───────────┘ │  │  │  Board:  BoardColumn[]          │ │ │
│  └───────────────┘  │  │  Epics:  EpicCard[]             │ │ │
│                      │  └─────────────────────────────────┘ │ │
│                      └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## State Management

Using Svelte 5 runes with context-based stores:

```typescript
// Global app state (set in +layout.svelte)
const appState = createAppState();
setContext('app', appState);

// Per-repo issues state (set in repos/[repoId]/+layout.svelte)
const issuesState = createIssuesState(repoId);
setContext('issues', issuesState);

// Components access via getContext()
const { repos, currentRepo } = getContext('app');
const { issues, filters, boardColumns } = getContext('issues');
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit 5 |
| UI Components | shadcn-svelte |
| Icons | Iconify (@iconify/svelte) |
| Styling | Tailwind CSS |
| Real-time | socket.io |
| File Watching | chokidar |
| Markdown | marked + dompurify |
| State | Svelte 5 runes ($state, $derived) |

## Key Design Decisions

### 1. REST + socket.io Hybrid
- REST for CRUD: Simpler, works with SvelteKit form actions, easy to debug
- socket.io for events: Real-time file change notifications, room-based subscriptions

### 2. Server-side Config Storage
- `~/.beads-sv/config.json` stores managed repos list
- Persists across browser sessions
- Single source of truth

### 3. Markdown Issue Format
- Compatible with existing beads CLI
- Human-readable in git diffs
- Custom parser (non-standard frontmatter format)

### 4. Multi-repo Architecture
- One beads-sv instance manages N repositories
- Each repo has independent .beads directory
- Cross-repo dashboard for overview

### 5. shadcn-svelte Components
- Consistent, accessible UI primitives
- Customizable via Tailwind
- Reduces custom component code
