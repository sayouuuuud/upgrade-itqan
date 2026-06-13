"""
mimo_chat.py — Gemini x MIMO Conversation Bridge + Arena
========================================================

A tkinter GUI that hosts a self-running DISCUSSION between two agents:

    • Gemini  (purple)  — the BRAIN. Runs inside Antigravity (outside this script).
                          It thinks, decides, and directs MIMO. It talks to this
                          bridge through two text files (see below).
    • MIMO    (blue)    — the EXECUTOR. The @mimo-ai/cli agent that actually
                          runs / writes code and reports back.
    • You     (green)   — can inject a message at any time.
    • System  (yellow)  — status / diagnostics.

You just WATCH them go back and forth until they reach a result.

Run:
    python scripts/mimo_chat.py

--------------------------------------------------------------------------------
HOW THE AUTOMATIC DISCUSSION LOOP WORKS  (the two-way bridge)
--------------------------------------------------------------------------------
Gemini lives in Antigravity, so it can't be called like an API. Instead it
drives the loop by reading / writing two files in the project root:

    gemini_to_mimo.txt   Gemini WRITES its next message here.
    mimo_to_gemini.txt   This script WRITES MIMO's latest reply here for Gemini.

The cycle (Gemini keeps it going until the task is done):

    1. Gemini writes a message      -> gemini_to_mimo.txt
    2. This bridge detects it, clears the file, sends it to MIMO, shows it.
    3. MIMO answers.  The bridge shows the answer AND writes it ->
       mimo_to_gemini.txt
    4. Gemini reads mimo_to_gemini.txt, thinks, and writes the NEXT message
       back to gemini_to_mimo.txt.
    5. Repeat 1-4 until Gemini decides they're done.

So tell Gemini something like:
    "اقرأ mimo_to_gemini.txt بعد كل رد، فكّر، واكتب ردك/توجيهك التالي في
     gemini_to_mimo.txt. كمّل النقاش مع mimo لحد ما تخلصوا المهمة."

(There is no fixed round limit — the loop runs until Gemini stops writing.)


--------------------------------------------------------------------------------
THE CORE PROBLEM (and how this script solves it)
--------------------------------------------------------------------------------
Your experiments showed:
    mimo                                   -> TUI, holds port 4096
    mimo run "msg"                         -> "hangs"
    mimo run --attach http://...:4096 ...  -> "hangs"

The hang is NOT (mainly) a port conflict. Per the official CLI docs
(https://mimo.xiaomi.com/mimocode/cli-options):

    • `mimo run` already defaults to a *random* local port, so it does not
      collide with the TUI on 4096.
    • `mimo run` blocks waiting for INTERACTIVE PERMISSION APPROVAL on stdin
      (approve file writes / command execution). With no TTY attached from a
      subprocess, it waits forever  ==>  "hangs".

The fix is two flags:
    --dangerously-skip-permissions   auto-approve so it never waits on stdin
    --format json                    machine-readable events we can parse

Strategy used here (most deterministic, fully decoupled from your TUI):

    1. Start our OWN headless server:  `mimo serve --port <free-port>`
       (`serve` = headless; `web` = serve + open browser. We want headless.)
    2. Wait until that port accepts TCP connections.
    3. For every message:
           mimo run --attach http://127.0.0.1:<port> \
                    --dangerously-skip-permissions \
                    --format json [--continue] "<message>"
       `--continue` (after the first turn) keeps the conversation going.
    4. Parse the JSON events and extract the assistant's text.
    5. Kill our server on exit.

If `mimo serve` can't be started, we fall back to plain `mimo run` (random
port) with the same flags — which also works now that permissions are skipped.

Everything that touches `mimo` goes through Git Bash because that is how it is
installed on your machine.
"""

import json
import os
import queue
import re
import socket
import subprocess
import threading
import time
import tkinter as tk
from tkinter import scrolledtext

# ──────────────────────────────────────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────────────────────────────────────
BASH = r"C:\Program Files\Git\bin\bash.exe"          # Git Bash on Windows
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEMINI_FILE = os.path.join(ROOT_DIR, "gemini_to_mimo.txt")  # IPC: Gemini -> MIMO
REPLY_FILE = os.path.join(ROOT_DIR, "mimo_to_gemini.txt")   # IPC: MIMO -> Gemini
MSG_FILE = os.path.join(ROOT_DIR, "_mimo_msg.txt")          # temp message buffer

# Appended after every MIMO reply so Gemini keeps the discussion alive and does
# not stop early. Gemini must keep iterating until it is truly finished, then
# write a line that is exactly DONE.
CONTINUE_FOOTER = (
    "\n----------------------------------------------------------------------\n"
    "[CONTINUE PROTOCOL — رسالة للـ Gemini]\n"
    "انت العقل المدبّر و mimo هو المنفّذ. مهمتك ما تنتهيش بمجرد رد واحد.\n"
    "1) راجع رد mimo فوق بدقّة: هل نفّذ المطلوب فعلاً وصح؟\n"
    "2) لو فيه ناقص/خطأ/خطوة جاية → اكتب توجيهك التالي لـ mimo في\n"
    "   gemini_to_mimo.txt وكمّل النقاش.\n"
    "3) متقفش ولا تختصر طالما المهمة لسه مخلصتش.\n"
    "4) لما (وبس لما) المهمة تخلص وتتأكد من المراجعة، اكتب سطر = DONE\n"
    "----------------------------------------------------------------------\n"
)

# Use a dedicated headless server instead of fighting the TUI on 4096.
USE_DEDICATED_SERVER = True
RUN_TIMEOUT = 240            # seconds to wait for one MIMO answer
SERVER_BOOT_TIMEOUT = 40     # seconds to wait for `mimo serve` to come up

FIRST_GEMINI_QUESTION = (
    ""
)

# Strip ANSI color/control codes from `--format default` output (fallback path).
ANSI_RE = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]")


def bash_available() -> bool:
    return os.path.exists(BASH)


def bash_cmd(shell_line: str) -> list:
    """Build a Git Bash invocation, falling back to PATH `mimo` if no Git Bash.

    MIMO is installed via `bash install.sh`, which typically drops the binary in
    ~/.local/bin and adds it to PATH inside .bashrc (NOT .bash_profile). A login
    shell only sources .bash_profile/.profile, so `mimo` may be "not found" even
    though it is installed. To be safe we explicitly prepend the common install
    locations to PATH for every command.
    """
    prefix = (
        'export PATH="$HOME/.local/bin:$HOME/bin:$HOME/.mimocode/bin:$PATH"; '
    )
    full = prefix + shell_line
    if bash_available():
        return [BASH, "-l", "-c", full]
    # Last-resort fallback: hope `bash` is on PATH for the default shell.
    return ["bash", "-l", "-c", full]


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def port_open(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.6)
        try:
            return s.connect_ex((host, port)) == 0
        except OSError:
            return False


def extract_text(raw: str) -> str:
    """
    Pull the assistant's readable text out of MIMO output.

    Handles three shapes defensively because the exact JSON event schema can
    vary between versions:
      1. Newline-delimited JSON events (`--format json`)
      2. A single JSON document
      3. Plain/`default` formatted text (fallback) -> strip ANSI
    """
    raw = (raw or "").strip()
    if not raw:
        return "(no response)"

    collected: list[str] = []

    def harvest(node):
        """Recursively collect text-ish fields from a parsed JSON node."""
        if isinstance(node, str):
            return
        if isinstance(node, list):
            for item in node:
                harvest(item)
            return
        if isinstance(node, dict):
            ntype = str(node.get("type", "")).lower()
            role = str(node.get("role", "")).lower()

            # Ignore obvious tool / reasoning noise; keep assistant-facing text.
            is_texty = ("text" in ntype) or ntype in ("message", "content", "")
            if (is_texty or role == "assistant"):
                for key in ("text", "content", "value", "message", "delta"):
                    val = node.get(key)
                    if isinstance(val, str) and val.strip():
                        collected.append(val)
                    elif isinstance(val, (list, dict)):
                        harvest(val)
            # Always descend into common containers.
            for key in ("parts", "part", "messages", "events", "data", "choices",
                        "content"):
                if key in node:
                    harvest(node[key])

    parsed_any = False
    # Try newline-delimited JSON first.
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            harvest(json.loads(line))
            parsed_any = True
        except (json.JSONDecodeError, ValueError):
            continue

    # Try whole-document JSON if line parsing found nothing.
    if not collected:
        try:
            harvest(json.loads(raw))
            parsed_any = True
        except (json.JSONDecodeError, ValueError):
            pass

    if collected:
        # De-duplicate consecutive identical chunks, then join.
        out, prev = [], None
        for chunk in collected:
            if chunk != prev:
                out.append(chunk)
            prev = chunk
        text = "".join(out).strip()
        if text:
            return text

    # Fallback: not JSON (or nothing useful) -> treat as formatted text.
    cleaned = ANSI_RE.sub("", raw).strip()
    return cleaned or ("(parsed JSON but found no text)" if parsed_any else "(no response)")


# ──────────────────────────────────────────────────────────────────────────────
# MIMO backend
# ──────────────────────────────────────────────────────────────────────────────
class MimoBackend:
    """Owns the headless mimo server and runs single-shot `mimo run` calls."""

    def __init__(self, log):
        self.log = log                      # callable(sender, text)
        self.port: int | None = None
        self.server_proc: subprocess.Popen | None = None
        self.started_conversation = False   # toggles --continue after turn 1
        self.lock = threading.Lock()        # serialize calls to MIMO
        self.ready = False

    # ── server lifecycle ──────────────────────────────────────────────────────
    def start(self):
        if not USE_DEDICATED_SERVER:
            self.log("System", "Using plain `mimo run` (random port) mode.")
            self.ready = True
            return

        if not bash_available():
            self.log("System",
                     f"⚠ Git Bash not found at {BASH}. Trying PATH `mimo` instead.")

        self.port = find_free_port()
        self.log("System", f"Starting headless MIMO server on port {self.port} …")

        no_window = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        try:
            self.server_proc = subprocess.Popen(
                bash_cmd(f"mimo serve --port {self.port} --print-logs"),
                cwd=ROOT_DIR,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=no_window,
            )
        except Exception as e:
            self.log("System", f"⚠ Could not launch `mimo serve`: {e}")
            self.log("System", "Falling back to plain `mimo run` mode.")
            self.port = None
            self.ready = True
            return

        # Wait for the port to accept connections.
        deadline = time.time() + SERVER_BOOT_TIMEOUT
        while time.time() < deadline:
            if self.server_proc.poll() is not None:
                self.log("System",
                         "⚠ `mimo serve` exited early — falling back to "
                         "plain `mimo run` mode.")
                self.port = None
                self.ready = True
                return
            if port_open(self.port):
                self.ready = True
                self.log("System", f"✅ MIMO server is up on http://127.0.0.1:{self.port}")
                return
            time.sleep(0.4)

        self.log("System",
                 "⚠ Server did not respond in time — falling back to "
                 "plain `mimo run` mode.")
        self.port = None
        self.ready = True

    def shutdown(self):
        if self.server_proc and self.server_proc.poll() is None:
            try:
                if os.name == "nt":
                    # Kill the whole bash+mimo tree.
                    subprocess.run(
                        ["taskkill", "/F", "/T", "/PID", str(self.server_proc.pid)],
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                    )
                else:
                    self.server_proc.terminate()
            except Exception:
                pass

    # ── ask MIMO ───────────────────────────────────────────────────────────────
    def ask(self, message: str) -> str:
        """Send one message to MIMO and return its text answer (blocking)."""
        with self.lock:
            # Pass the message via a temp file so quotes / Arabic / newlines
            # survive the shell intact.
            try:
                with open(MSG_FILE, "w", encoding="utf-8") as f:
                    f.write(message)
            except Exception as e:
                return f"[ERROR] could not write temp message file: {e}"

            parts = ["mimo run",
                     "--dangerously-skip-permissions",
                     "--format json"]
            if self.port:
                parts.append(f"--attach http://127.0.0.1:{self.port}")
            if self.started_conversation:
                parts.append("--continue")
            parts.append('"$(cat _mimo_msg.txt)"')
            parts.append("< /dev/null")
            parts.append("2>&1")
            shell_line = " ".join(parts)

            no_window = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
            try:
                result = subprocess.run(
                    bash_cmd(shell_line),
                    cwd=ROOT_DIR,
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=RUN_TIMEOUT,
                    creationflags=no_window,
                )
                raw = result.stdout or result.stderr or ""
                answer = extract_text(raw)
                self.started_conversation = True
                return answer
            except subprocess.TimeoutExpired:
                return f"[TIMEOUT] MIMO took longer than {RUN_TIMEOUT}s."
            except Exception as e:
                return f"[ERROR] {e}"
            finally:
                if os.path.exists(MSG_FILE):
                    try:
                        os.remove(MSG_FILE)
                    except OSError:
                        pass


# ──────────────────────────────────────────────────────────────────────────────
# GUI
# ──────────────────────────────────────────────────────────────────────────────
class ChatUI:
    COLORS = {
        "Gemini": "#a855f7",   # purple
        "MIMO":   "#38bdf8",   # blue
        "You":    "#4ade80",   # green
        "System": "#fbbf24",   # yellow
    }

    def __init__(self, root: tk.Tk):
        self.root = root
        self.q: queue.Queue = queue.Queue()
        self.busy = False
        self.turn = 0          # how many Gemini<->MIMO exchanges so far

        root.title("Gemini × MIMO — Chat Arena")
        root.geometry("960x700")
        root.configure(bg="#0f172a")

        self._build()
        self._poll()

        # Backend + file watcher start after the window exists.
        self.backend = MimoBackend(self._enqueue)
        threading.Thread(target=self._boot, daemon=True).start()
        threading.Thread(target=self._watch_gemini_file, daemon=True).start()

        root.protocol("WM_DELETE_WINDOW", self._on_close)

    # ── build widgets ──────────────────────────────────────────────────────────
    def _build(self):
        tk.Label(
            self.root, text="🤖  Gemini  ×  MIMO  —  Chat Arena",
            font=("Segoe UI", 16, "bold"), fg="#e94560", bg="#0f172a", pady=10,
        ).pack(fill=tk.X)

        self.chat = scrolledtext.ScrolledText(
            self.root, state="disabled", wrap=tk.WORD,
            font=("Consolas", 11), bg="#1e293b", fg="#e2e8f0",
            relief=tk.FLAT, padx=12, pady=12, insertbackground="white",
        )
        self.chat.pack(fill=tk.BOTH, expand=True, padx=12, pady=(0, 8))

        for name, color in self.COLORS.items():
            self.chat.tag_config(f"name_{name}", foreground=color,
                                 font=("Consolas", 11, "bold"))
        self.chat.tag_config("body", foreground="#e2e8f0")
        self.chat.tag_config("body_sys", foreground="#94a3b8",
                             font=("Consolas", 10, "italic"))

        bar = tk.Frame(self.root, bg="#0f172a")
        bar.pack(fill=tk.X, padx=12, pady=(0, 10))

        # You row
        row1 = tk.Frame(bar, bg="#0f172a")
        row1.pack(fill=tk.X, pady=(0, 6))
        tk.Label(row1, text="You →", fg=self.COLORS["You"], bg="#0f172a",
                 font=("Segoe UI", 10, "bold"), width=9, anchor="w").pack(side=tk.LEFT)
        self.user_entry = tk.Entry(
            row1, font=("Segoe UI", 12), bg="#1e293b", fg="white",
            insertbackground="white", relief=tk.FLAT,
        )
        self.user_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=6)
        self.user_entry.bind("<Return>", self._send_user)
        tk.Button(row1, text="Send ▶", command=self._send_user,
                  bg="#e94560", fg="white", font=("Segoe UI", 10, "bold"),
                  relief=tk.FLAT, padx=14, cursor="hand2").pack(side=tk.RIGHT, padx=(6, 0))

        # Gemini row
        row2 = tk.Frame(bar, bg="#0f172a")
        row2.pack(fill=tk.X)
        tk.Label(row2, text="Gemini →", fg=self.COLORS["Gemini"], bg="#0f172a",
                 font=("Segoe UI", 10, "bold"), width=9, anchor="w").pack(side=tk.LEFT)
        self.gemini_entry = tk.Entry(
            row2, font=("Segoe UI", 11), bg="#1e293b", fg="#c4b5fd",
            insertbackground="#c4b5fd", relief=tk.FLAT,
        )
        self.gemini_entry.insert(0, FIRST_GEMINI_QUESTION)
        self.gemini_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=6)
        self.gemini_entry.bind("<Return>", lambda e: self._send_gemini())
        tk.Button(row2, text="🤖 Ask mimo", command=self._send_gemini,
                  bg="#7c3aed", fg="white", font=("Segoe UI", 10, "bold"),
                  relief=tk.FLAT, padx=14, cursor="hand2").pack(side=tk.RIGHT, padx=(6, 0))

        self.status = tk.StringVar(value="Booting MIMO backend …")
        tk.Label(self.root, textvariable=self.status, bg="#020617", fg="#64748b",
                 font=("Segoe UI", 9), anchor="w", padx=10).pack(fill=tk.X)

    # ── threading plumbing ──────────────────────────────────────────────────────
    def _enqueue(self, sender: str, text: str):
        self.q.put((sender, text))

    def _set_status(self, text: str):
        self.q.put(("__STATUS__", text))

    def _poll(self):
        try:
            while True:
                sender, text = self.q.get_nowait()
                if sender == "__STATUS__":
                    self.status.set(text)
                elif sender == "__DONE__":
                    self.busy = False
                else:
                    self._add(sender, text)
        except queue.Empty:
            pass
        self.root.after(120, self._poll)

    def _add(self, sender: str, text: str):
        body_tag = "body_sys" if sender == "System" else "body"
        self.chat.config(state="normal")
        self.chat.insert(tk.END, f"\n{sender}: ", f"name_{sender}")
        self.chat.insert(tk.END, f"{text}\n", body_tag)
        self.chat.see(tk.END)
        self.chat.config(state="disabled")

    def _boot(self):
        self.backend.start()
        self._set_status("Ready. Ask MIMO something.")

    # ── send paths ───────────────────────────────────────────────────────────
    def _dispatch(self, message: str, sender: str):
        if not getattr(self, "backend", None) or not self.backend.ready:
            self._enqueue("System", "Backend still booting — try again in a moment.")
            return
        if self.busy:
            self._enqueue("System", "MIMO is still answering the previous message …")
            return

        self.busy = True
        self.turn += 1
        turn = self.turn
        self._enqueue(sender, message)          # echo what we asked
        self._enqueue("System", "⏳ Waiting for MIMO …")
        self._set_status(f"⏳ Turn {turn}: asking MIMO ({sender}) …")

        def worker():
            reply = self.backend.ask(message)
            self._enqueue("MIMO", reply)
            # Hand MIMO's reply back to Gemini through the reverse channel so
            # the discussion can continue automatically. We append a persistent
            # CONTINUE protocol so Gemini does NOT quit early: it must either
            # send the next directive or explicitly write DONE.
            try:
                with open(REPLY_FILE, "w", encoding="utf-8") as f:
                    f.write(f"[MIMO · TURN {turn} REPLY]\n")
                    f.write(reply.rstrip() + "\n")
                    f.write(CONTINUE_FOOTER)
            except OSError as e:
                self._enqueue("System", f"⚠ Could not write {os.path.basename(REPLY_FILE)}: {e}")
            self._set_status(f"✅ Turn {turn} done. Gemini's move (reads "
                             f"{os.path.basename(REPLY_FILE)}).")
            self.q.put(("__DONE__", ""))

        threading.Thread(target=worker, daemon=True).start()

    def _send_user(self, _event=None):
        msg = self.user_entry.get().strip()
        if msg:
            self.user_entry.delete(0, tk.END)
            self._dispatch(msg, "You")

    def _send_gemini(self):
        msg = self.gemini_entry.get().strip()
        if msg:
            self._dispatch(msg, "Gemini")

    # ── Gemini IPC file watcher ──────────────────────────────────────────────────
    def _watch_gemini_file(self):
        # Make sure both ends of the bridge exist so Gemini can read/write them.
        for path in (GEMINI_FILE, REPLY_FILE):
            if not os.path.exists(path):
                try:
                    open(path, "w", encoding="utf-8").close()
                except OSError:
                    pass
        if not os.path.exists(GEMINI_FILE):
            return
        last_mtime = os.path.getmtime(GEMINI_FILE)
        while True:
            time.sleep(0.5)
            try:
                mtime = os.path.getmtime(GEMINI_FILE)
            except OSError:
                continue
            if mtime <= last_mtime:
                continue
            last_mtime = mtime
            try:
                with open(GEMINI_FILE, "r", encoding="utf-8") as f:
                    content = f.read().strip()
            except OSError:
                continue
            if content:
                # Clear the file so the same message isn't resent.
                try:
                    open(GEMINI_FILE, "w", encoding="utf-8").close()
                except OSError:
                    pass
                # Hop back onto the UI thread to dispatch.
                self.root.after(0, lambda c=content: self._dispatch(c, "Gemini"))

    def _on_close(self):
        self._set_status("Shutting down MIMO server …")
        try:
            self.backend.shutdown()
        except Exception:
            pass
        self.root.destroy()


# ──────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    root = tk.Tk()
    app = ChatUI(root)
    root.mainloop()
