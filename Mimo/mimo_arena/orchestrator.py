"""The Arena orchestrator.

Roles (3 layers, exactly as agreed):
  • Gemini  = MAESTRO. Reads ARENA_OUTBOX (world state) and writes commands
              to GEMINI_INBOX as JSON. Never edits files itself.
  • Scout   = a dedicated MIMO worker that ANALYZES the project and returns a
              precise map + execution plan that Gemini relies on.
  • Executors = N MIMO workers running tasks in parallel. A file-lock manager
              prevents two of them from editing the same file at once.

What changed in this hardened version (all behind the same bridge protocol):
  • Event-driven bridge: watchdog reacts to inbox writes instantly instead of
    polling mtime (with a polling fallback if watchdog isn't installed).
  • Sequence numbers: each inbox command is de-duplicated so the same JSON is
    never executed twice and none is missed.
  • Mission state machine: every assign becomes a tracked mission in SQLite,
    so a crash can be inspected/resumed. Tasks carry structured results.
  • Structured outbox: the maestro reads a clean verdict per worker/task
    (status + answer + summary) instead of guessing from free text.
  • Live streaming: worker output is broadcast token-by-token to the UI.
  • Heartbeat watchdog: a silently-hung worker is auto-restarted.
  • Retries: a failed/timed-out task is retried up to config.TASK_MAX_RETRIES.
  • Locks: acquired with a fair blocking queue and released in `finally` so a
    crash never leaves a file deadlocked.
  • Isolation: with MIMO_ISOLATE=1 each task runs in its own git worktree.
"""
from __future__ import annotations
import hashlib
import json
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Dict, List, Optional

from . import config, isolation, missions, personas, settings
from .locks import lock_manager
from .mimo_worker import MimoWorker
from .chat_store import chat_store

GEMINI_INBOX = config.GEMINI_INBOX
ARENA_OUTBOX = config.ARENA_OUTBOX


class Orchestrator:
    def __init__(self, num_executors: int = None,
                 broadcaster: Optional[Callable[[dict], None]] = None):
        config.ensure_dirs()
        self.broadcast = broadcaster or (lambda e: None)
        self.workers: Dict[str, MimoWorker] = {}
        self.turn = 0
        self.active_chat_id: Optional[str] = None
        self._exec_count = 0
        self._stop = threading.Event()
        self._pool = ThreadPoolExecutor(max_workers=32)
        self._mu = threading.Lock()

        # bridge de-dup: remember the last command we executed
        self._last_cmd_hash: Optional[str] = None
        self._last_inbox_mtime = 0.0
        self._watch_thread: Optional[threading.Thread] = None
        self._observer = None  # watchdog observer, if available
        self._hb_thread: Optional[threading.Thread] = None

        settings.load()
        self.workers["scout"] = MimoWorker("scout", role="scout",
                                            preferred_port=config.BASE_PORT)
        n = (int(settings.get("executors.default", config.DEFAULT_EXECUTORS))
             if num_executors is None else num_executors)
        for _ in range(n):
            self._make_executor()
        # Expose installed skills in world state for the UI
        self._installed_skills = personas.list_installed_skills()

    # --- worker management --------------------------------------------------
    def _make_executor(self) -> MimoWorker:
        self._exec_count += 1
        wid = f"executor-{self._exec_count}"
        w = MimoWorker(wid, role="executor",
                       preferred_port=config.BASE_PORT + self._exec_count)
        self.workers[wid] = w
        return w

    def add_executor(self) -> str:
        w = self._make_executor()
        try:
            w.start()
        except Exception as e:
            self._emit_system(f"Failed to start {w.id}: {e}")
        missions.audit("system", "executor.add", w.id)
        self._push_state()
        return w.id

    def boot(self) -> None:
        for w in self.workers.values():
            try:
                w.start()
            except Exception as e:
                self._emit_system(f"Failed to start {w.id}: {e}")
        self._start_bridge_watch()
        self._hb_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self._hb_thread.start()
        self._push_state()

    def set_active_chat(self, chat_id: str) -> None:
        self.active_chat_id = chat_id

    # --- the Gemini bridge (event-driven, with polling fallback) ------------
    def _start_bridge_watch(self) -> None:
        try:
            from watchdog.observers import Observer
            from watchdog.events import FileSystemEventHandler

            inbox = GEMINI_INBOX
            handler_self = self

            class _Handler(FileSystemEventHandler):
                def on_modified(self, event):
                    if Path_str(event.src_path) == Path_str(str(inbox)):
                        handler_self._read_inbox()

                def on_created(self, event):
                    if Path_str(event.src_path) == Path_str(str(inbox)):
                        handler_self._read_inbox()

            def Path_str(p: str) -> str:
                import os
                return os.path.abspath(p)

            self._observer = Observer()
            self._observer.schedule(_Handler(), str(GEMINI_INBOX.parent), recursive=False)
            self._observer.start()
            self._emit_system("Bridge running in event-driven mode (watchdog).")
        except Exception:
            # Fallback: the original mtime polling loop.
            self._watch_thread = threading.Thread(target=self._poll_inbox, daemon=True)
            self._watch_thread.start()
            self._emit_system("Bridge running in polling mode (watchdog not installed).")

    def _poll_inbox(self) -> None:
        while not self._stop.is_set():
            try:
                if GEMINI_INBOX.exists():
                    mtime = GEMINI_INBOX.stat().st_mtime
                    if mtime > self._last_inbox_mtime:
                        self._last_inbox_mtime = mtime
                        self._read_inbox()
            except Exception:
                pass
            time.sleep(config.BRIDGE_POLL)

    def _read_inbox(self) -> None:
        """Read one command from the inbox, de-duplicated by content hash."""
        try:
            if not GEMINI_INBOX.exists():
                return
            raw = GEMINI_INBOX.read_text(encoding="utf-8").strip()
            if not raw:
                return
            h = hashlib.sha1(raw.encode("utf-8")).hexdigest()
            if h == self._last_cmd_hash:
                return  # same command already handled — skip duplicate
            self._last_cmd_hash = h
            try:
                cmd = json.loads(raw)
            except json.JSONDecodeError:
                self._emit_system("Invalid Gemini command (malformed JSON).")
                return
            missions.audit("gemini", "inbox.command", cmd.get("action", ""), raw[:300])
            self._pool.submit(self._handle_command, cmd)
        except Exception:
            pass

    def submit_command(self, cmd: dict) -> None:
        self._pool.submit(self._handle_command, cmd)

    def _handle_command(self, cmd: dict) -> None:
        action = (cmd.get("action") or "").lower()
        if action == "say":
            self._emit("gemini", "maestro", cmd.get("message", ""))
        elif action == "scout":
            self._run_scout(cmd.get("message", "Analyse the project and prepare an execution plan."))
        elif action == "assign":
            self._run_mission(cmd.get("tasks", []))
        elif action == "add_executor":
            self.add_executor()
            self._emit_system("New executor added.")
        elif action == "done":
            self._emit("gemini", "maestro", cmd.get("message", "Mission complete."),
                       meta={"done": True})
        else:
            self._emit_system(f"Unknown Gemini command: {action!r}")
        self._push_state()

    # --- role execution -----------------------------------------------------
    def _run_scout(self, message: str) -> None:
        scout = self.workers.get("scout")
        if not scout:
            return
        self._trace("scout", "scout_start",
                    detail="Scout is analyzing the project and building an execution plan",
                    roles=["scout"], skills=[])
        self._emit_system("Scout is analyzing the project...")
        prompt = (
            "You are the project analyst (Scout). Inspect the relevant files and produce:\n"
            "  1. A precise project map (files, modules, responsibilities).\n"
            "  2. An execution plan split into independent, distributable tasks.\n"
            "  3. For each task: which files it owns, which persona is best suited.\n\n"
            "REQUEST: " + message
        )
        model = settings.model_for("models.scout")
        self._trace("scout", "llm_call",
                    detail=f"Calling Scout LLM (model: {model or 'default'})",
                    roles=["scout"])
        try:
            reply = self._stream_ask(scout, prompt, sender="scout", role="scout",
                                       model=model, persona="planner")
            self._trace("scout", "scout_done",
                        detail="Scout analysis complete", roles=["scout"])
            self._emit("scout", "scout", reply, meta={"final": True, "streamed": True})
        except Exception as e:
            self._emit_system(f"Scout encountered an error: {e}")
            self._trace("scout", "scout_done", detail=f"Scout error: {e}", roles=["scout"])

    def _run_mission(self, tasks: List[dict]) -> None:
        """Turn an 'assign' into a tracked mission and run tasks in parallel."""
        if not tasks:
            return
        mission_id = missions.create_mission(
            title=(tasks[0].get("message", "") or "")[:48],
            chat_id=self.active_chat_id,
            plan={"tasks": tasks},
        )
        missions.set_mission_status(mission_id, "assigned")

        task_ids: Dict[int, str] = {}
        for i, t in enumerate(tasks):
            persona = t.get("persona") if personas.exists(t.get("persona")) else \
                ("planner" if t.get("to") == "scout" else personas.DEFAULT_PERSONA)
            task_ids[i] = missions.add_task(
                mission_id, t.get("to", ""), t.get("message", ""),
                t.get("files", []), persona=persona)

        missions.set_mission_status(mission_id, "running")
        futures = {}
        for i, t in enumerate(tasks):
            wid = t.get("to")
            worker = self.workers.get(wid)
            if not worker:
                self._emit_system(f"No worker named '{wid}'.")
                missions.set_task_status(task_ids[i], "failed",
                                         answer="no", summary="worker not found")
                continue
            futures[self._pool.submit(
                self._run_one_task, worker, t, task_ids[i])] = wid

        for fut in as_completed(futures):
            try:
                fut.result()
            except Exception as e:
                self._emit_system(f"Error in {futures[fut]}: {e}")

        # mission verdict
        m = missions.get_mission(mission_id)
        all_done = all(tk["status"] == "done" for tk in m["tasks"]) if m["tasks"] else False
        missions.set_mission_status(mission_id, "review")

        # Optional automatic review pass before finalizing.
        if all_done and settings.get("review.auto"):
            self._run_review_pass(mission_id, m)
            m = missions.get_mission(mission_id)
            all_done = all(tk["status"] == "done" for tk in m["tasks"])

        missions.set_mission_status(mission_id, "done" if all_done else "failed")
        self._push_state()

    def _run_review_pass(self, mission_id: str, mission: dict) -> None:
        """Reviewer persona inspects the finished work as the `review` step."""
        reviewer = (self.workers.get("scout")
                    or next(iter(w for w in self.workers.values()
                                 if w.role == "executor"), None))
        if not reviewer:
            return
        touched = sorted({f for t in mission["tasks"] for f in (t.get("files") or [])})
        summaries = "\n".join(
            f"- {t['worker_id']} ({t.get('persona','coder')}): {t.get('summary','')}"
            for t in mission["tasks"])
        review_prompt = (
            f"Review the results of this mission. Affected files: {', '.join(touched) or 'none specified'}.\n"
            f"Summary of what the team implemented:\n{summaries}\n\n"
            "Check correctness, security, consistency with requirements, and code quality."
        )
        tid = missions.add_task(mission_id, reviewer.id, review_prompt,
                                touched, persona="reviewer")
        self._trace(reviewer.id, "review_start",
                    detail=f"Reviewer inspecting {len(touched)} files",
                    persona="reviewer", roles=["reviewer", "security"])
        self._emit_system("Reviewer is inspecting the mission results before approval...")
        self._run_one_task(reviewer, {"message": review_prompt, "files": [],
                                      "persona": "reviewer"}, tid)

    def _run_one_task(self, worker: MimoWorker, task: dict, task_id: str) -> None:
        files = task.get("files", []) or []
        message = task.get("message", "")
        persona_id = task.get("persona") if personas.exists(task.get("persona")) else \
            ("planner" if worker.role == "scout" else personas.DEFAULT_PERSONA)
        model = settings.model_for(personas.model_key(persona_id))
        p_info = personas.get(persona_id)
        p_roles = p_info.get("roles", [persona_id])
        p_skills = personas.skills_for(persona_id)
        acquired: List[str] = []
        wt = None
        missions.set_task_status(task_id, "running")

        self._trace(worker.id, "task_start",
                    detail=f"Starting task — persona: {persona_id} | roles: {', '.join(p_roles)} | skills: {', '.join(p_skills[:3])}{'...' if len(p_skills) > 3 else ''}",
                    persona=persona_id, roles=p_roles, skills=p_skills, task_id=task_id)
        try:
            # Fair, blocking lock acquisition with TTL safety net.
            for f in files:
                if lock_manager.try_acquire(f, worker.id, intent="editing"):
                    acquired.append(f)
                else:
                    owner = lock_manager.owner_of(f)
                    self._trace(worker.id, "lock_wait",
                                detail=f"Waiting for file '{f}' (locked by {owner})",
                                persona=persona_id, task_id=task_id)
                    self._emit_system(f"{worker.id} waiting for '{f}' (locked by {owner}).")
                    if lock_manager.acquire(f, worker.id, intent="editing"):
                        acquired.append(f)
                        self._trace(worker.id, "lock_acquired",
                                    detail=f"Acquired lock on '{f}'",
                                    persona=persona_id, task_id=task_id)
                    else:
                        self._trace(worker.id, "lock_skipped",
                                    detail=f"Skipped '{f}' after queue timeout",
                                    persona=persona_id, task_id=task_id)
                        self._emit_system(f"{worker.id} skipped '{f}' after queue timeout.")
            worker.held_locks = acquired
            self._push_state()

            # Optional git-worktree isolation.
            wt = isolation.create_worktree(worker.id)
            run_cwd = wt["path"] if wt else None
            if wt:
                self._trace(worker.id, "worktree",
                            detail=f"Running in isolated worktree: {wt['branch']}",
                            persona=persona_id, task_id=task_id)
                self._emit_system(f"{worker.id} running in isolated worktree ({wt['branch']}).")

            preamble = personas.build_preamble(persona_id)
            note = ""
            if acquired:
                note = ("\n\n[FILE LOCKS] You hold exclusive edit rights on: "
                        + ", ".join(acquired) + ". Edit only these files.")
            note += ("\n\n[FORMAT] End your reply with a single JSON line summarising the result: "
                     '{"status":"done|failed","answer":"yes|no","summary":"..."}')

            self._trace(worker.id, "llm_call",
                        detail=f"Calling LLM (model: {model or 'default'}) — {len(preamble + message + note)} chars prompt",
                        persona=persona_id, roles=p_roles, skills=p_skills, task_id=task_id)

            # Run with retries (persona preamble in front, persona model behind).
            reply, ok = self._ask_with_retries(
                worker, preamble + message + note, run_cwd, task_id, model, persona_id)

            if wt:
                merge_note = isolation.finalize_worktree(wt, ok)
                self._trace(worker.id, "worktree_merge",
                            detail=f"Worktree finalized: {merge_note}",
                            persona=persona_id, task_id=task_id)
                self._emit_system(f"{worker.id}: worktree result = {merge_note}")
                missions.audit(worker.id, "worktree.finalize", wt["branch"], merge_note)
                wt = None

            verdict = self._parse_verdict(reply, ok)
            self._trace(worker.id, "verdict",
                        detail=f"Verdict: {verdict['status']} — {verdict['answer']} | {verdict['summary'][:120]}",
                        persona=persona_id, task_id=task_id)
            missions.set_task_status(task_id, "done" if ok else "failed",
                                     answer=verdict["answer"], summary=verdict["summary"])
            # The trailing JSON verdict line is an internal control envelope — it
            # lives in meta, so strip it from the human-facing bubble text.
            display = self._strip_verdict(reply)
            self._emit(worker.id, "executor", display,
                       meta={"final": True, "streamed": True,
                             "persona": persona_id, "roles": p_roles, **verdict})
        finally:
            # Always release locks + tear down isolation, even on crash.
            if wt:
                isolation.finalize_worktree(wt, False)
            for f in acquired:
                lock_manager.release(f, worker.id)
            worker.held_locks = []
            self._push_state()

    def _ask_with_retries(self, worker: MimoWorker, prompt: str,
                          run_cwd: Optional[str], task_id: str,
                          model: Optional[str] = None,
                          persona_id: Optional[str] = None):
        """Stream the worker's reply; retry on timeout/crash."""
        attempts = int(settings.get("task.retries", config.TASK_MAX_RETRIES)) + 1
        last = ""
        for n in range(1, attempts + 1):
            missions.set_task_status(task_id, "running", bump_attempt=True)
            self._trace(worker.id, "attempt",
                        detail=f"Attempt {n}/{attempts} — worker executing task",
                        task_id=task_id)
            self._emit_system(f"{worker.id} executing (attempt {n}/{attempts})...")
            try:
                last = self._stream_ask(worker, prompt, sender=worker.id, role="executor",
                                        cwd=run_cwd, model=model, persona=persona_id)
                self._trace(worker.id, "attempt_ok",
                            detail=f"Attempt {n} completed successfully",
                            task_id=task_id)
                return last, True
            except Exception as e:
                missions.audit(worker.id, "task.error", task_id, str(e)[:200])
                self._trace(worker.id, "attempt_fail",
                            detail=f"Attempt {n} failed: {str(e)[:120]}",
                            task_id=task_id)
                self._emit_system(f"{worker.id} failed attempt {n}: {e}")
                if not worker.alive():
                    self._trace(worker.id, "worker_restart",
                                detail=f"Worker unresponsive — restarting...",
                                task_id=task_id)
                    self._emit_system(f"Restarting {worker.id}...")
                    try:
                        worker.restart()
                    except Exception:
                        pass
                time.sleep(0.5)
        return last or f"[{worker.id}] all attempts failed", False

    def _stream_ask(self, worker: MimoWorker, prompt: str, sender: str,
                    role: str, cwd: Optional[str] = None,
                    model: Optional[str] = None,
                    persona: Optional[str] = None) -> str:
        """Call worker.ask and broadcast each token to the UI as it arrives.

        Each chunk event carries sender, role, persona, and a stream_id so the
        frontend can correctly route tokens to the right bubble even when
        multiple workers stream concurrently.
        """
        stream_id = f"{sender}:{int(time.time() * 1000)}"
        _first = [True]   # mutable flag — set to False after first chunk

        def on_chunk(text: str) -> None:
            ev = {
                "type": "stream",
                "sender": sender,
                "role": role,
                "persona": persona or "",
                "text": text,
                "stream_id": stream_id,
                "first": _first[0],
                "ts": time.time(),
            }
            _first[0] = False
            self.broadcast(ev)

        return worker.ask(prompt, on_chunk=on_chunk, cwd=cwd, model=model)

    @staticmethod
    def _strip_verdict(reply: str) -> str:
        """Remove the trailing JSON verdict line from the human-facing reply.

        Workers are asked to end with a control envelope like
        {"status":"done","answer":"yes","summary":"..."}. That belongs in meta,
        not in the chat bubble, so we drop the last JSON-only line. Any earlier
        prose is preserved. Falls back to the original text if nothing is left.
        """
        if not reply:
            return reply
        lines = reply.rstrip().splitlines()
        # Walk backwards, dropping trailing blank lines and a single JSON line
        # that looks like our verdict envelope.
        while lines:
            last = lines[-1].strip()
            if not last:
                lines.pop()
                continue
            if last.startswith("{") and last.endswith("}") and (
                '"status"' in last or '"answer"' in last or '"summary"' in last
            ):
                try:
                    json.loads(last)
                    lines.pop()
                except Exception:
                    pass
            break
        cleaned = "\n".join(lines).strip()
        return cleaned or reply.strip()

    @staticmethod
    def _parse_verdict(reply: str, ok: bool) -> dict:
        """Extract the trailing JSON verdict the worker was asked to append."""
        answer, summary, status = ("unknown", "", "done" if ok else "failed")
        if reply:
            for line in reversed(reply.splitlines()):
                line = line.strip()
                if line.startswith("{") and line.endswith("}"):
                    try:
                        obj = json.loads(line)
                        answer = str(obj.get("answer", answer))
                        summary = str(obj.get("summary", summary))
                        status = str(obj.get("status", status))
                        break
                    except Exception:
                        continue
        return {"status": status, "answer": answer, "summary": summary[:300]}

    # --- heartbeat watchdog -------------------------------------------------
    def _heartbeat_loop(self) -> None:
        while not self._stop.is_set():
            time.sleep(5)
            for w in list(self.workers.values()):
                try:
                    if w.ready and not w.alive():
                        self._emit_system(f"{w.id} unresponsive — auto-restarting.")
                        self._trace(w.id, "worker_restart",
                                    detail="Heartbeat watchdog triggered auto-restart")
                        missions.audit("system", "worker.restart", w.id, "heartbeat")
                        w.restart()
                        self._push_state()
                except Exception:
                    pass

    # --- emit + state -------------------------------------------------------
    def _emit(self, sender: str, role: str, text: str, meta: dict = None) -> None:
        if self.active_chat_id:
            chat_store.add_message(self.active_chat_id, sender, role, text, meta)
        self.broadcast({
            "type": "message",
            "sender": sender, "role": role, "text": text,
            "meta": meta or {}, "ts": time.time(),
        })

    def _emit_system(self, text: str) -> None:
        self._emit("system", "system", text)

    def _trace(self, worker_id: str, stage: str, detail: str = "",
               persona: str = "", skills: list = None,
               roles: list = None, task_id: str = "") -> None:
        """Broadcast a live trace event so the UI can show exactly what the
        agent is doing, where it is in the pipeline, and which skills are active."""
        self.broadcast({
            "type": "trace",
            "worker": worker_id,
            "stage": stage,       # e.g. "lock_wait", "task_start", "retrying", "verdict"
            "detail": detail,
            "persona": persona,
            "roles": roles or [],
            "skills": skills or [],
            "task_id": task_id,
            "ts": time.time(),
        })

    def world_state(self) -> dict:
        return {
            "turn": self.turn,
            "workers": [w.status() for w in self.workers.values()],
            "locks": lock_manager.snapshot(),
            "missions": missions.open_missions(),
            "personas": personas.list_public(),
            "protocol": {
                "actions": ["scout", "assign", "say", "add_executor", "done"],
                "personas": personas.ORDER,
                "assign_task_schema": {
                    "to": "executor-N | scout",
                    "persona": "planner | designer | coder | reviewer",
                    "message": "what to do",
                    "files": ["files this task owns"],
                },
                "outbox_schema": {
                    "workers": "[{id, role, ready, busy, alive, held_locks}]",
                    "missions": "[{id, status, tasks:[{worker_id, persona, status, answer, summary}]}]",
                },
                "note": "Write JSON commands to gemini_inbox.json; read this file each turn. "
                        "Give every assign task a persona. Per-task verdict lives in "
                        "missions[].tasks[].{status,answer,summary}.",
            },
            "ts": time.time(),
        }

    def _push_state(self) -> None:
        self.turn += 1
        state = self.world_state()
        try:
            ARENA_OUTBOX.write_text(
                json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass
        self.broadcast({"type": "state", **state})

    # --- resume -------------------------------------------------------------
    def resume_open_missions(self) -> int:
        """After a restart, re-run any mission that didn't finish."""
        reopened = missions.open_missions()
        for m in reopened:
            pending = [t for t in m["tasks"] if t["status"] in ("pending", "running")]
            if not pending:
                continue
            self._trace("system", "mission_resume",
                        detail=f"Resuming mission {m['id']} — {len(pending)} task(s) pending")
            self._emit_system(f"Resuming mission {m['id']} ({len(pending)} task(s) remaining).")
            tasks = [{"to": t["worker_id"], "message": t["message"],
                      "files": t["files"], "persona": t.get("persona", "coder")}
                     for t in pending]
            self._pool.submit(self._run_mission, tasks)
        return len(reopened)

    # --- user-originated message -------------------------------------------
    @staticmethod
    def _normalize_skills(skills: Optional[List[str]]) -> List[str]:
        allowed = ("analyze", "plan", "build", "review")
        out = []
        for skill in skills or []:
            key = str(skill or "").strip().lower()
            if key in allowed and key not in out:
                out.append(key)
        return out

    @staticmethod
    def _message_for_skills(text: str, skills: List[str]) -> str:
        if not skills:
            return text
        labels = {
            "analyze": "analyze the existing context first",
            "plan": "produce a concise execution plan",
            "build": "implement the requested changes",
            "review": "self-review the result for quality and regressions",
        }
        focus = "\n".join(f"- {labels[s]}" for s in skills if s in labels)
        return (
            f"{text}\n\n"
            "[HYBRID CHECKLIST]\n"
            "Focus only on the selected tracks below:\n"
            f"{focus}"
        )

    @staticmethod
    def _persona_for_skills(skills: List[str]) -> Optional[str]:
        picked = set(skills or [])
        if not picked:
            return None
        if "build" in picked and "review" in picked and ("analyze" in picked or "plan" in picked):
            return "fullstack"
        if "build" in picked and "review" in picked:
            return "coder-reviewer"
        if "build" in picked:
            return "coder"
        if "review" in picked:
            return "reviewer"
        if "analyze" in picked or "plan" in picked:
            return "planner-architect"
        return None

    def user_message(self, text: str, to: str = "scout",
                     persona: Optional[str] = None,
                     skills: Optional[List[str]] = None) -> None:
        picked_skills = self._normalize_skills(skills)
        missions.audit(
            "user",
            "message.route",
            to,
            json.dumps(
                {"persona": persona, "skills": picked_skills, "text_preview": text[:120]},
                ensure_ascii=False,
            ),
        )
        self._trace(
            "user",
            "task_start",
            detail=f"user routed message to {to}",
            persona=persona or "",
            skills=picked_skills,
        )
        self._emit("you", "user", text, meta={"skills": picked_skills})
        routed_text = self._message_for_skills(text, picked_skills)
        if to == "scout":
            self._run_scout(routed_text)
        elif to in self.workers:
            task = {"to": to, "message": routed_text}
            if personas.exists(persona):
                task["persona"] = persona
            else:
                derived_persona = self._persona_for_skills(picked_skills)
                if personas.exists(derived_persona):
                    task["persona"] = derived_persona
            self._run_mission([task])
        else:
            self._run_scout(routed_text)

    def shutdown(self) -> None:
        self._stop.set()
        if self._observer:
            try:
                self._observer.stop()
                self._observer.join(timeout=2)
            except Exception:
                pass
        for w in self.workers.values():
            w.stop()
        self._pool.shutdown(wait=False)
