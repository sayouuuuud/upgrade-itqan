"""Central configuration. Everything is overridable via environment variables
so it works out-of-the-box on your Windows + Git Bash + mimo setup."""
import os
from pathlib import Path

# Root where mimo runs and where bridge/state files live.
# Defaults to the directory you launch from (your project).
ROOT = Path(os.environ.get("MIMO_ROOT", os.getcwd())).resolve()

# Internal working dir for arena state (chats, locks, bridge files).
ARENA_DIR = ROOT / ".mimo_arena"
CHATS_DIR = ARENA_DIR / "chats"
BRIDGE_DIR = ARENA_DIR / "bridge"

# --- Gemini <-> Arena JSON bridge -------------------------------------------
# Gemini WRITES its commands here; the arena watches this file (mtime poll),
# exactly like your original `_mimo_msg.txt` technique but structured as JSON.
GEMINI_INBOX = BRIDGE_DIR / "gemini_inbox.json"
# The arena WRITES the latest world-state here; Gemini READS it each turn.
ARENA_OUTBOX = BRIDGE_DIR / "arena_outbox.json"

# --- mimo CLI ---------------------------------------------------------------
MIMO_BIN = os.environ.get("MIMO_BIN", "mimo")
# Base port; each worker gets BASE_PORT + index as a *preference* only.
BASE_PORT = int(os.environ.get("MIMO_BASE_PORT", "4097"))
# Seconds to wait for a `mimo serve` to become reachable.
SERVE_TIMEOUT = int(os.environ.get("MIMO_SERVE_TIMEOUT", "40"))
# Per-task hard timeout (seconds).
TASK_TIMEOUT = int(os.environ.get("MIMO_TASK_TIMEOUT", "900"))

# --- Web server -------------------------------------------------------------
HOST = os.environ.get("MIMO_HOST", "127.0.0.1")
PORT = int(os.environ.get("MIMO_PORT", "8765"))

# Default executors spun up on boot (you can add more live from the UI).
DEFAULT_EXECUTORS = int(os.environ.get("MIMO_EXECUTORS", "2"))

# How often (seconds) to poll the Gemini inbox for new commands.
# Used ONLY as a fallback when watchdog (event-driven) is unavailable.
BRIDGE_POLL = float(os.environ.get("MIMO_BRIDGE_POLL", "0.7"))

# --- Persistence ------------------------------------------------------------
# SQLite database that holds chats, messages, missions and the audit log.
DB_PATH = ARENA_DIR / "arena.db"

# --- Lock manager -----------------------------------------------------------
# A held lock older than this (seconds) is considered stale and auto-released,
# so a crashed/hung worker can never deadlock the whole arena.
LOCK_TTL = float(os.environ.get("MIMO_LOCK_TTL", "600"))
# How long a task waits in the fair queue for a busy file before giving up.
LOCK_WAIT_TIMEOUT = float(os.environ.get("MIMO_LOCK_WAIT", "120"))

# --- Reliability ------------------------------------------------------------
# A worker that misses heartbeats for longer than this is auto-restarted.
HEARTBEAT_TIMEOUT = float(os.environ.get("MIMO_HEARTBEAT_TIMEOUT", "600"))
# How many times a failed/timed-out task is retried before marked failed.
TASK_MAX_RETRIES = int(os.environ.get("MIMO_TASK_RETRIES", "2"))

# --- Isolation --------------------------------------------------------------
# When true, each executor runs inside its own git worktree and the result is
# merged back on success. Falls back to shared ROOT when git is unavailable.
ISOLATE_WORKTREES = os.environ.get("MIMO_ISOLATE", "0") == "1"
WORKTREES_DIR = ARENA_DIR / "worktrees"

# --- Models (per role / persona) --------------------------------------------
# The name passed to `mimo run --model <name>`. Empty string = mimo's own
# default model. These are just the *defaults*; everything here is overridable
# live from the Settings panel in the UI (stored in the DB at runtime).
# Maestro is informational (Gemini runs inside the editor, not via mimo).
MODEL_DEFAULT = os.environ.get("MIMO_MODEL", "")
MODEL_MAESTRO = os.environ.get("MIMO_MODEL_MAESTRO", "gemini-2.0-flash")
MODEL_SCOUT = os.environ.get("MIMO_MODEL_SCOUT", "")
MODEL_DESIGNER = os.environ.get("MIMO_MODEL_DESIGNER", "")
MODEL_PLANNER = os.environ.get("MIMO_MODEL_PLANNER", "")
MODEL_CODER = os.environ.get("MIMO_MODEL_CODER", "")
MODEL_REVIEWER = os.environ.get("MIMO_MODEL_REVIEWER", "")

# When true, after every assigned mission a Reviewer persona automatically
# inspects the result before the mission is marked done.
REVIEW_AUTO = os.environ.get("MIMO_REVIEW_AUTO", "0") == "1"

# --- Skills (reserved for the next phase) -----------------------------------
# A persona may OWN any number of skills, but only a few are INJECTED per task
# to keep the context tight. These bound the dynamic injection.
SKILLS_PER_TASK_DEFAULT = int(os.environ.get("MIMO_SKILLS_DEFAULT", "3"))
SKILLS_PER_TASK_MAX = int(os.environ.get("MIMO_SKILLS_MAX", "5"))
SKILLS_DIR = ARENA_DIR / "skills"


def ensure_dirs() -> None:
    for d in (ARENA_DIR, CHATS_DIR, BRIDGE_DIR, WORKTREES_DIR):
        d.mkdir(parents=True, exist_ok=True)


# Human/Gemini-readable instructions file, written to the PROJECT ROOT so that
# Gemini (running inside Antigravity with file access) can simply open it and
# learn exactly how to talk to the workers.
GEMINI_GUIDE = ROOT / "GEMINI_BRIDGE.md"

_GUIDE_TEXT = """# MIMO Arena — Gemini Bridge Guide

You (Gemini) are the **MAESTRO**. You never edit project files directly.
Instead you command a team of MIMO workers through two JSON files.

## The two bridge files
- **You WRITE commands to:** `.mimo_arena/bridge/gemini_inbox.json`
- **You READ the world state from:** `.mimo_arena/bridge/arena_outbox.json`

The Arena watches `gemini_inbox.json` continuously. Every time you overwrite it
with a new JSON command, the Arena picks it up within ~0.7s and acts on it.
After every action the Arena refreshes `arena_outbox.json` with the latest
worker states, their replies, and which files are locked. Read it each turn.

## How to ring the workers (write ONE of these to gemini_inbox.json)

Ask the Scout to analyze the project and return a map + plan:
```json
{ "action": "scout", "message": "Analyze all project files and return a map + execution plan." }
```

Assign tasks to run IN PARALLEL (each worker locks the files it owns):
```json
{ "action": "assign", "tasks": [
    { "to": "executor-1", "message": "Implement the authentication system.", "files": ["auth.py"] },
    { "to": "executor-2", "message": "Implement the REST API layer.", "files": ["api.py"] },
    { "to": "scout",      "message": "Review the plan and check for conflicts." }
] }
```

Add another executor when you need more hands:
```json
{ "action": "add_executor" }
```

Show a free-text note to the user, or end the mission:
```json
{ "action": "say",  "message": "Task distribution started — assigning work to the execution team." }
{ "action": "done", "message": "Mission complete: authentication system and API have been built." }
```

## Reading results (structured — no guessing)
`arena_outbox.json` now gives you a clean verdict per task. Instead of reading
the worker's free text, check:
```json
{
  "workers":  [{"id":"executor-1","ready":true,"busy":false,"alive":true,"held_locks":["auth.py"]}],
  "missions": [{"id":"...","status":"running",
                "tasks":[{"worker_id":"executor-1","status":"done","answer":"yes","summary":"built auth"}]}]
}
```
- `missions[].status`: planning | assigned | running | review | done | failed
- `tasks[].status`: pending | running | done | failed
- `tasks[].answer`: the worker's yes/no verdict for its task
- `tasks[].summary`: one-line description of what it did
A mission disappears from the list once it is done/failed, so an empty
`missions` array means there is no work in flight.

## Rules
- Always write the FULL JSON object (overwrite the file, do not append).
- Read `arena_outbox.json` before issuing the next command so you see results.
  Prefer the structured `missions[].tasks[]` verdicts over the raw chat text.
- Two workers can never edit the same file at once — the lock manager queues
  them fairly and auto-frees stale locks, so you never deadlock. Split work by
  file ownership to avoid waiting.
- The Scout is your most accurate file analyst; rely on it for the initial map,
  then distribute the plan across executors.
"""


def write_gemini_guide() -> None:
    """Drop the bridge guide into the project root for Gemini to read."""
    try:
        GEMINI_GUIDE.write_text(_GUIDE_TEXT, encoding="utf-8")
    except Exception:
        pass


def bootstrap() -> None:
    """Prepare dirs, seed empty bridge files, and write the Gemini guide."""
    ensure_dirs()
    if not GEMINI_INBOX.exists():
        GEMINI_INBOX.write_text("", encoding="utf-8")
    if not ARENA_OUTBOX.exists():
        ARENA_OUTBOX.write_text("{}", encoding="utf-8")
    write_gemini_guide()
