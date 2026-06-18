"""A single MIMO worker = its own `mimo serve` process on its own port,
its own session, and its own message file. Fully isolated from siblings,
which is exactly why they can run truly in parallel.

Upgrades over the original:
  • LIVE STREAMING: ask() now uses Popen and reads mimo's JSON-event stream
    line by line, invoking on_chunk(text) as each token arrives. The UI feels
    instant instead of waiting for the whole task to finish.
  • HEARTBEAT: every streamed line bumps last_beat, and alive() reports whether
    the worker is still producing output, so the orchestrator can restart a
    silently-hung worker.
  • cwd override: a task can run inside a git worktree for isolation.
"""
from __future__ import annotations
import json
import re
import socket
import subprocess
import threading
import time
from pathlib import Path
from typing import Callable, Optional

from . import config, settings

_ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")


def strip_ansi(text: str) -> str:
    if not text:
        return text
    text = _ANSI_RE.sub("", text)
    text = re.sub(r"\x1b", "", text)
    return text


def find_free_port(preferred: int = 0) -> int:
    if preferred:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((config.HOST, preferred))
                return preferred
            except OSError:
                pass
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((config.HOST, 0))
        return s.getsockname()[1]


def _port_open(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((config.HOST, port)) == 0


# Event "type" values that carry tool/diagnostic noise rather than the
# assistant's natural-language answer. We skip these when pulling text.
_NON_TEXT_TYPES = {
    "tool", "tool_use", "tool_call", "tool_result", "tool-call", "tool-result",
    "reasoning", "thinking", "step-start", "step-finish", "usage", "error",
}


def _text_from_event(obj: dict) -> Optional[str]:
    """Pull the assistant text out of one mimo JSON event, if present.

    mimo's `--format json` schema has shifted across versions, so instead of
    hard-coding one shape we check every known location and fall back to a
    recursive search. This is what prevents the dreaded empty reply when the
    event envelope changes.
    """
    if not isinstance(obj, dict):
        return None

    etype = str(obj.get("type") or obj.get("event") or "").lower()
    if etype in _NON_TEXT_TYPES:
        return None

    # 1) Direct text on the event.
    if isinstance(obj.get("text"), str) and obj["text"]:
        return obj["text"]

    # 2) Streaming delta shapes: {"delta": "..."} or {"delta": {"text": "..."}}.
    delta = obj.get("delta")
    if isinstance(delta, str) and delta:
        return delta
    if isinstance(delta, dict) and isinstance(delta.get("text"), str):
        return delta["text"]

    # 3) A single part: {"part": {"type": "text", "text": "..."}}.
    part = obj.get("part")
    if isinstance(part, dict):
        t = _text_from_event(part)
        if t:
            return t

    # 4) content / parts arrays (and message.content), as on assistant events.
    for key in ("content", "parts"):
        val = obj.get(key)
        if isinstance(val, str) and val:
            return val
        if isinstance(val, list):
            collected = [_text_from_event(p) if isinstance(p, dict) else (p if isinstance(p, str) else None)
                         for p in val]
            joined = "".join(c for c in collected if c)
            if joined:
                return joined

    # 5) Nested envelopes: {"message": {...}}, {"data": {...}}, {"response": {...}}.
    for key in ("message", "data", "response", "output"):
        val = obj.get(key)
        if isinstance(val, str) and val:
            return val
        if isinstance(val, dict):
            t = _text_from_event(val)
            if t:
                return t

    return None


def extract_text(raw: str) -> str:
    """Parse a full mimo JSON-event stream into one clean text blob.

    Kept for callers that already have the whole output buffered.
    """
    if not raw:
        return ""
    chunks, saw_json = [], False
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            saw_json = True
        except Exception:
            continue
        if isinstance(obj, dict):
            t = _text_from_event(obj)
            if t is not None:
                chunks.append(t)
    if chunks:
        return strip_ansi("".join(chunks)).strip()
    return strip_ansi(raw).strip() if not saw_json else ""


class MimoWorker:
    def __init__(self, worker_id: str, role: str = "executor", preferred_port: int = 0):
        self.id = worker_id
        self.role = role  # "scout" | "executor"
        self.preferred_port = preferred_port
        self.port: Optional[int] = None
        self.proc: Optional[subprocess.Popen] = None
        self.ready = False
        self.busy = False
        self.current_task: Optional[str] = None
        self.last_output: str = ""
        self.held_locks: list[str] = []
        self.last_beat: float = time.time()
        self._session_started = False
        self._mu = threading.Lock()

    # --- lifecycle ----------------------------------------------------------
    def start(self) -> None:
        if self.ready:
            return
        self.port = find_free_port(self.preferred_port)
        self.proc = subprocess.Popen(
            [config.MIMO_BIN, "serve", "--port", str(self.port)],
            cwd=str(config.ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        deadline = time.time() + config.SERVE_TIMEOUT
        while time.time() < deadline:
            if _port_open(self.port):
                self.ready = True
                self.last_beat = time.time()
                return
            if self.proc.poll() is not None:
                raise RuntimeError(f"[{self.id}] mimo serve exited early")
            time.sleep(0.4)
        raise TimeoutError(f"[{self.id}] mimo serve did not become ready on :{self.port}")

    def _msg_file(self) -> Path:
        config.ensure_dirs()
        return config.BRIDGE_DIR / f"_msg_{self.id}.txt"

    def _raw_debug_file(self) -> Path:
        config.ensure_dirs()
        return config.BRIDGE_DIR / f"_raw_{self.id}.txt"

    def _dump_raw(self, message: str, cmd: list[str], raw_lines: list[str],
                  err_text: str, code: Optional[int]) -> None:
        """Persist the last empty-reply exchange so the real mimo JSON schema
        can be inspected and the parser tuned if needed."""
        try:
            with open(self._raw_debug_file(), "w", encoding="utf-8") as f:
                f.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] exit={code}\n")
                f.write(f"CMD: {' '.join(cmd)}\n")
                f.write(f"MSG: {message}\n")
                f.write(f"STDOUT LINES ({len(raw_lines)}):\n")
                f.write("\n".join(raw_lines) if raw_lines else "(none)")
                f.write("\n----- STDERR -----\n")
                f.write(err_text or "(none)")
                f.write("\n")
        except OSError:
            pass

    def ask(self, message: str, on_chunk: Optional[Callable[[str], None]] = None,
            cwd: Optional[str] = None, model: Optional[str] = None) -> str:
        """Send a prompt and stream the reply.

        on_chunk(text) is called for every assistant text fragment as it
        arrives (live). The full concatenated reply is also returned.
        cwd lets the orchestrator run this task inside an isolated worktree.
        model overrides the LLM mimo uses for this task (persona-driven); empty
        means mimo's own default.
        """
        if not self.ready:
            self.start()
        mf = self._msg_file()
        mf.write_text(message, encoding="utf-8")
        with self._mu:
            self.busy = True
            self.current_task = message
        self.last_beat = time.time()
        run_cwd = cwd or str(config.ROOT)

        base_flags = ["--dangerously-skip-permissions", "--format", "json"]
        model = (model or "").strip()
        if model:
            base_flags += ["--model", model]
        cont = ["--continue"] if self._session_started else []

        # Primary invocation: attach to this worker's `mimo serve` session.
        attached_cmd = ([config.MIMO_BIN, "run", message,
                         "--attach", f"http://{config.HOST}:{self.port}"]
                        + base_flags + cont)
        # Fallback: a standalone `mimo run` (no --attach). Used when the attached
        # run returns nothing — e.g. when the reply streams out of the serve
        # process instead of this invocation. This mirrors the standalone CLI.
        standalone_cmd = [config.MIMO_BIN, "run", message] + base_flags + cont

        task_timeout = float(settings.get("task.timeout", config.TASK_TIMEOUT))
        try:
            out, raw_lines, err_text, code = self._stream_run(
                attached_cmd, run_cwd, on_chunk, task_timeout)

            # If the attached run produced nothing readable, retry standalone.
            if not out:
                self._dump_raw(message, attached_cmd, raw_lines, err_text, code)
                out2, raw2, err2, code2 = self._stream_run(
                    standalone_cmd, run_cwd, on_chunk, task_timeout)
                if out2:
                    out = out2
                else:
                    self._dump_raw(message, standalone_cmd, raw2, err2, code2)
                    out = (f"[{self.id}] produced no readable output "
                           f"(mimo exit {code}/{code2}). "
                           f"Raw saved to {self._raw_debug_file().name}.")

            self._session_started = True
            self.last_output = out
            return out
        finally:
            with self._mu:
                self.busy = False
                self.current_task = None

    def _stream_run(self, cmd: list[str], run_cwd: str,
                    on_chunk: Optional[Callable[[str], None]],
                    task_timeout: float) -> tuple[str, list[str], str, Optional[int]]:
        """Run one mimo command, streaming text via on_chunk.

        Returns (clean_text, raw_stdout_lines, stderr_text, returncode). The
        text is recovered through several fallbacks (live chunks → full-buffer
        reparse → plain lines → stderr) so schema drift can't swallow a reply.
        """
        chunks: list[str] = []
        raw_lines: list[str] = []
        plain_lines: list[str] = []
        proc: Optional[subprocess.Popen] = None
        try:
            proc = subprocess.Popen(
                cmd, cwd=run_cwd,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                encoding="utf-8", errors="replace", bufsize=1,
            )
            deadline = time.time() + task_timeout
            for line in proc.stdout:  # blocks per line, streams as mimo emits
                self.last_beat = time.time()  # heartbeat on every line
                line = line.strip()
                if not line:
                    if time.time() > deadline:
                        raise subprocess.TimeoutExpired(cmd, task_timeout)
                    continue
                raw_lines.append(line)
                try:
                    obj = json.loads(line)
                except Exception:
                    # Not a JSON event line — keep as plain-text fallback in case
                    # mimo ignored --format json or printed a plain message.
                    plain_lines.append(line)
                    if time.time() > deadline:
                        raise subprocess.TimeoutExpired(cmd, task_timeout)
                    continue
                if isinstance(obj, dict):
                    t = _text_from_event(obj)
                    if t:
                        chunks.append(t)
                        if on_chunk:
                            try:
                                on_chunk(strip_ansi(t))
                            except Exception:
                                pass
                if time.time() > deadline:
                    raise subprocess.TimeoutExpired(cmd, task_timeout)
            proc.wait(timeout=10)

            out = strip_ansi("".join(chunks)).strip()
            if not out:
                out = extract_text("\n".join(raw_lines))
            if not out and plain_lines:
                out = strip_ansi("\n".join(plain_lines)).strip()
            err_text = ""
            if not out:
                err_text = strip_ansi((proc.stderr.read() if proc.stderr else "") or "").strip()
                out = err_text
            return out, raw_lines, err_text, proc.returncode
        except subprocess.TimeoutExpired:
            if proc and proc.poll() is None:
                proc.kill()
            self.last_output = f"[{self.id}] task timed out after {task_timeout}s"
            raise
            self.last_beat = time.time()

    def stop(self) -> None:
        if self.proc and self.proc.poll() is None:
            try:
                self.proc.terminate()
                try:
                    self.proc.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.proc.kill()
            except Exception:
                pass
        self.ready = False
        self._session_started = False

    def restart(self) -> None:
        """Hard-cycle the worker (used by the heartbeat watchdog)."""
        self.stop()
        time.sleep(0.3)
        self.start()

    # --- health -------------------------------------------------------------
    def alive(self) -> bool:
        """A worker is unhealthy if its serve process died, or if it's been
        busy yet silent (no streamed output) past the heartbeat timeout."""
        if self.proc is None or self.proc.poll() is not None:
            return False
        hb = float(settings.get("heartbeat.timeout", config.HEARTBEAT_TIMEOUT))
        if self.busy and (time.time() - self.last_beat) > hb:
            return False
        return True

    # --- status -------------------------------------------------------------
    def status(self) -> dict:
        return {
            "id": self.id,
            "role": self.role,
            "port": self.port,
            "ready": self.ready,
            "busy": self.busy,
            "alive": self.alive(),
            "last_beat": self.last_beat,
            "current_task": (self.current_task or "")[:120],
            "held_locks": list(self.held_locks),
        }
