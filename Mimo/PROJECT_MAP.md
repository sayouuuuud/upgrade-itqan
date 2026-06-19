# MIMO Arena — Project Map & Execution Plan

## 1. Project Map

### Architecture Overview
MIMO Arena is a **multi-agent command center** that coordinates multiple MIMO workers (AI agents) to work in parallel on software engineering tasks. The system follows a **Maestro-Scout-Executor** pattern with Gemini as the conductor.

```
┌─────────────────────────────────────────────────────────────────┐
│                        MIMO Arena                               │
├─────────────────────────────────────────────────────────────────┤
│  User (Browser)                                                 │
│    │                                                            │
│    ▼                                                            │
│  ┌──────────────────┐      JSON Bridge      ┌──────────────────┐│
│  │   FastAPI Server │ ◄────────────────────► │   Gemini        ││
│  │   (server.py)    │  gemini_inbox.json     │   (Maestro)     ││
│  └────────┬─────────┘  arena_outbox.json     └──────────────────┘│
│           │                                                      │
│           ├── Scout (mimo_worker.py)                             │
│           ├── executor-1 ──┐                                     │
│           ├── executor-2   ├─ Parallel Workers                   │
│           └── executor-N ──┘                                     │
│                    │                                              │
│                    ▼                                              │
│           Lock Manager (locks.py)                                │
└─────────────────────────────────────────────────────────────────┘
```

### Core Modules

| Module | File | Responsibility |
|--------|------|----------------|
| **Server** | `mimo_arena/server.py` | FastAPI REST + WebSocket endpoints, serves web UI |
| **Orchestrator** | `mimo_arena/orchestrator.py` | Core logic: worker management, bridge protocol, task distribution |
| **Worker** | `mimo_arena/mimo_worker.py` | Individual MIMO process management, streaming, health checks |
| **Locks** | `mimo_arena/locks.py` | File-lock manager with TTL, fair FIFO queue, auto-release |
| **Missions** | `mimo_arena/missions.py` | Mission state machine (planning→assigned→running→review→done) |
| **Personas** | `mimo_arena/personas.py` | Agent roles, skill injection, system prompts |
| **Settings** | `mimo_arena/settings.py` | Runtime settings store (models, timeouts, toggles) |
| **Config** | `mimo_arena/config.py` | Central configuration, env vars, paths |
| **Database** | `mimo_arena/db.py` | SQLite layer (WAL mode, per-thread connections) |
| **Chat Store** | `mimo_arena/chat_store.py` | Persistent chat storage with auto-titling |
| **Isolation** | `mimo_arena/isolation.py` | Git worktree isolation for parallel tasks |
| **Frontend** | `mimo_arena/web/` | HTML/JS UI with glassmorphism design |

### Data Flow
1. **User → Scout**: User sends request via UI → Scout analyzes project
2. **Scout → Maestro**: Scout returns project map + execution plan
3. **Maestro → Executors**: Gemini assigns tasks with file ownership
4. **Executors → Lock Manager**: Workers acquire locks before editing files
5. **Executors → UI**: Live streaming of output token-by-token
6. **Review**: Optional auto-review pass before mission completion

---

## 2. Execution Plan — Independent Tasks

### Task 1: Backend Core — Server & API
**Persona**: `coder` | **Files**: `mimo_arena/server.py`
- Implement REST endpoints (state, missions, settings, chats)
- WebSocket hub for real-time updates
- Request/response models
- Startup/shutdown lifecycle

### Task 2: Backend Core — Orchestrator
**Persona**: `coder` | **Files**: `mimo_arena/orchestrator.py`
- Worker lifecycle management (boot, add, restart)
- Bridge protocol (inbox/outbox JSON files)
- Task distribution with parallel execution
- Mission state tracking
- Heartbeat watchdog
- Retry logic with exponential backoff

### Task 3: Backend Core — Worker Process
**Persona**: `coder` | **Files**: `mimo_arena/mimo_worker.py`
- `mimo serve` process management
- Streaming JSON event parsing
- Port allocation and health checks
- Heartbeat monitoring
- Session management

### Task 4: Backend Core — File Locking
**Persona**: `coder` | **Files**: `mimo_arena/locks.py`
- Thread-safe lock acquisition
- Fair FIFO queue (no starvation)
- TTL-based auto-release (stale lock detection)
- Snapshot for UI display
- Disk persistence for inspection

### Task 5: Backend Core — Mission Tracking
**Persona**: `coder` | **Files**: `mimo_arena/missions.py`
- Mission CRUD operations
- State machine transitions
- Audit log for security/debug
- Task-level structured results

### Task 6: Backend Core — Persona System
**Persona**: `coder` | **Files**: `mimo_arena/personas.py`
- Persona definitions (planner, designer, coder, reviewer, hybrids)
- Role→Skills mapping
- Skill injection (SKILL.md reading)
- Preamble builder for prompts

### Task 7: Backend Core — Settings & Config
**Persona**: `coder` | **Files**: `mimo_arena/settings.py`, `mimo_arena/config.py`
- Runtime settings with DB persistence
- Config from env vars
- Settings groups (models, execution, reliability, isolation)
- Model resolution per persona

### Task 8: Backend Core — Database Layer
**Persona**: `coder` | **Files**: `mimo_arena/db.py`
- SQLite schema (chats, messages, missions, tasks, audit, settings)
- WAL mode for concurrent access
- Per-thread connections
- Migration support

### Task 9: Backend Core — Chat Store
**Persona**: `coder` | **Files**: `mimo_arena/chat_store.py`
- Chat CRUD operations
- Message history with limit
- Auto-titling from first user message
- Atomic inserts

### Task 10: Backend Core — Git Isolation
**Persona**: `coder` | **Files**: `mimo_arena/isolation.py`
- Worktree creation per worker
- Branch-based isolation
- Merge on success, discard on failure
- Graceful fallback when git unavailable

### Task 11: Frontend — Main UI Layout
**Persona**: `designer` | **Files**: `mimo_arena/web/index.html`
- Sidebar with chat list
- Main content area with stream
- Right panel (team, personas, trace, locks, audit)
- Composer with target/hybrid selectors
- Settings drawer

### Task 12: Frontend — Styling & Design System
**Persona**: `designer` | **Files**: `mimo_arena/web/index.html` (CSS)
- CSS tokens (colors, fonts, spacing)
- Dark/light theme support
- Glassmorphism effects
- Responsive breakpoints
- Animation system

### Task 13: Frontend — JavaScript Logic
**Persona**: `coder` | **Files**: `mimo_arena/web/app.js`
- WebSocket connection and event handling
- Streaming bubble management
- Chat CRUD operations
- Settings drawer
- Tab navigation
- Dropdown menus

### Task 14: Frontend — Real-time Features
**Persona**: `coder` | **Files**: `mimo_arena/web/app.js`
- Live streaming with cursor animation
- Concurrent stream handling (stream_id tracking)
- Trace event visualization
- Worker status updates
- Lock display

### Task 15: Entry Point & Bootstrap
**Persona**: `coder` | **Files**: `run.py`, `mimo_arena/config.py`
- CLI argument parsing
- Browser auto-open
- Bootstrap sequence (dirs, bridge files, guide)

---

## 3. Task Dependencies & Parallelism

```
Independent Tasks (can run in parallel):
├── Task 4 (Locks)
├── Task 5 (Missions)
├── Task 6 (Personas)
├── Task 7 (Settings/Config)
├── Task 8 (Database)
├── Task 9 (Chat Store)
├── Task 10 (Isolation)
└── Task 11 (UI Layout)

Sequential Dependencies:
├── Task 8 (Database) → Task 5 (Missions) → Task 9 (Chat Store)
├── Task 7 (Config) → Task 3 (Worker) → Task 2 (Orchestrator)
├── Task 1 (Server) ← Task 2 (Orchestrator) + Task 6 (Personas)
└── Task 12 (Styling) ← Task 11 (UI Layout)
```

---

## 4. Recommended Execution Order

### Phase 1: Foundation (Parallel)
- Task 8: Database
- Task 4: Locks
- Task 6: Personas
- Task 7: Settings/Config

### Phase 2: Core Logic (Sequential)
- Task 5: Missions (depends on DB)
- Task 9: Chat Store (depends on DB)
- Task 3: Worker (depends on Config)
- Task 10: Isolation

### Phase 3: Orchestration (Sequential)
- Task 2: Orchestrator (depends on Worker, Locks, Missions, Personas)
- Task 1: Server (depends on Orchestrator)

### Phase 4: Frontend (Parallel)
- Task 11: UI Layout
- Task 12: Styling
- Task 13: JavaScript Logic
- Task 14: Real-time Features

### Phase 5: Integration
- Task 15: Entry Point & Bootstrap
- End-to-end testing
