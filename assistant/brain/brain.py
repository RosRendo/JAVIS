"""
JARVIS Brain — orchestrates the AI Gateway, memory, and rule-based fallback.

Flow:
  1. Build conversation context from SQLite history.
  2. Call AIGateway.query() → routes to active provider (Ollama / OpenAI / Gemini / Anthropic).
  3. Parse JSON tool-call or plain text from the response.
  4. If the gateway fails entirely, run the lightweight rule-based fallback.
"""

import os
import json
import re
from datetime import datetime

from assistant.brain.gateway import AIGateway
from assistant.memory.memory import JarvisMemory

# ─────────────────────────────────────────────
# System prompt (shared across all providers)
# ─────────────────────────────────────────────

SYSTEM_PROMPT_TEMPLATE = """\
You are JARVIS, an advanced AI desktop assistant for Windows running on Boss Rendo's PC.
Be concise, helpful, and futuristic. Speak directly — no markdown, no bullet points in speech.

When you need to perform an action, output ONLY a JSON object (no surrounding text):
{{"tool": "<tool_name>", "arguments": {{...}}}}

AVAILABLE TOOLS:
  execute_terminal_command(command, cwd) — Run any powershell command. Use to start dev servers, run scripts, manage servers. Optional `cwd`.
  read_file(filepath)             — Reads text from a file.
  write_file(filepath, content)   — Writes/overwrites a file with content.
  open_application(name)          — open apps: notepad, chrome, vscode, god, ark survival
  close_application(name)         — close the same apps
  open_website(name)              — open: youtube, facebook, discord, chatgpt, github, instagram
  search_google(query)            — search Google for any query
  get_system_status()             — returns CPU, RAM, battery info
  control_volume(action)          — action: "up", "down", or "mute"
  take_screenshot()               — saves a screenshot
  create_note(title, content)     — save a plain text note to data/notes/
  list_notes()                    — list saved notes
  read_note(filename)             — read a saved note
  set_reminder(text, delay_seconds) — schedule a timed reminder
  save_memory(key, value)         — store a long-term fact in the database
  create_vault_note(title, content, folder) — write a Markdown note to the Obsidian vault
  list_vault_notes(folder)        — list Markdown files in a vault folder

EXAMPLES:
  User: Open notepad
  → {{"tool": "open_application", "arguments": {{"name": "notepad"}}}}

  User: Remember that my Service Finder backend uses NestJS
  → {{"tool": "save_memory", "arguments": {{"key": "Service Finder backend", "value": "NestJS"}}}}

  User: Start my dev server in D:/project/frontend
  → {{"tool": "execute_terminal_command", "arguments": {{"command": "npm run dev", "cwd": "D:/project/frontend"}}}}

  User: Run my dashboard
  → {{"tool": "execute_terminal_command", "arguments": {{"command": "start_local.bat", "cwd": "D:\\FOR RENDO (ONLY )\\Personal Project\\Dashboard"}}}}

  User: Check what's inside package.json
  → {{"tool": "read_file", "arguments": {{"filepath": "package.json"}}}}

CONVERSATION HISTORY:
{history}
"""


class JarvisBrain:
    def __init__(self, config_path: str = "config/settings.json", memory_instance: JarvisMemory | None = None):
        self.memory = memory_instance or JarvisMemory()
        self.gateway = AIGateway(config_path=config_path)

    # ── Public API ────────────────────────────────

    def query(self, user_input: str) -> dict:
        """
        Returns:
          {
            "speak":     str,            # text for TTS
            "tool":      str | None,     # tool name if action needed
            "arguments": dict            # tool arguments
          }
        """
        self.memory.add_chat_msg("user", user_input)

        # Check fast rule-based fallback first
        fallback_result = self._rule_fallback(user_input)
        if fallback_result.get("tool"):
            return fallback_result

        try:
            system_prompt = self._build_system_prompt()
            raw = self.gateway.query(system_prompt, user_input)
            return self._parse(raw)
        except Exception as e:
            print(f"[Brain] Gateway error: {e}. Using rule-based fallback.")
            return fallback_result

    # ── Internal helpers ──────────────────────────

    def _build_system_prompt(self) -> str:
        history = self.memory.get_chat_history(limit=8)
        history_text = "\n".join(
            f"{m['role'].capitalize()}: {m['content']}" for m in history
        )
        now = datetime.now().strftime("%I:%M %p")
        return SYSTEM_PROMPT_TEMPLATE.format(history=history_text, time=now)

    def _parse(self, text: str) -> dict:
        """Extract a JSON tool-call block, or return plain speech."""
        text_clean = text.strip()
        
        # Remove markdown code block fences if present
        if text_clean.startswith("```"):
            lines = text_clean.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text_clean = "\n".join(lines).strip()
            
        # Try parsing the whole response first
        try:
            data = json.loads(text_clean)
            if "tool" in data:
                return {
                    "speak":     f"Running {data['tool'].replace('_', ' ')}.",
                    "tool":      data["tool"],
                    "arguments": data.get("arguments", {}),
                }
        except json.JSONDecodeError:
            pass

        # Use greedy matching \{[\s\S]*\} to catch nested JSON braces
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                data = json.loads(match.group(0))
                if "tool" in data:
                    return {
                        "speak":     f"Running {data['tool'].replace('_', ' ')}.",
                        "tool":      data["tool"],
                        "arguments": data.get("arguments", {}),
                    }
            except json.JSONDecodeError:
                pass

        # No valid tool call — plain spoken response
        return {"speak": text, "tool": None, "arguments": {}}

    # ── Rule-based fallback (no LLM needed) ──────

    def _rule_fallback(self, query: str) -> dict:
        q = query.lower()

        _apps    = ["notepad", "god", "ark survival", "chrome", "vscode", "vs code"]
        _sites   = ["youtube", "facebook", "discord", "chatgpt", "github", "instagram", "dashboard"]
        _volumes = {"up": ["volume up", "increase volume"],
                    "down": ["volume down", "decrease volume"],
                    "mute": ["mute", "volume mute"]}

        if "open" in q:
            for app in _apps:
                if app in q:
                    return {"speak": f"Opening {app}.", "tool": "open_application", "arguments": {"name": app}}
            for site in _sites:
                if site in q:
                    return {"speak": f"Opening {site}.", "tool": "open_website", "arguments": {"name": site}}

        if "close" in q:
            for app in _apps:
                if app in q:
                    return {"speak": f"Closing {app}.", "tool": "close_application", "arguments": {"name": app}}

        for action, phrases in _volumes.items():
            if any(p in q for p in phrases):
                labels = {"up": "Increasing", "down": "Decreasing", "mute": "Toggling mute on"}
                return {"speak": f"{labels[action]} volume.", "tool": "control_volume", "arguments": {"action": action}}

        if "screenshot" in q:
            return {"speak": "Taking a screenshot.", "tool": "take_screenshot", "arguments": {}}

        if any(w in q for w in ["cpu", "battery", "ram", "system status", "system condition"]):
            return {"speak": "Checking system status.", "tool": "get_system_status", "arguments": {}}

        if "time" in q:
            now = datetime.now().strftime("%I:%M %p")
            return {"speak": f"It is {now}.", "tool": None, "arguments": {}}

        if "git status" in q:
            return {"speak": "Checking git status.", "tool": "execute_terminal_command", "arguments": {"command": "git status"}}

        if "ping" in q:
            return {"speak": "Running ping command.", "tool": "execute_terminal_command", "arguments": {"command": "ping 8.8.8.8"}}

        if any(w in q for w in ["hello", "hi", "hey", "good morning", "good afternoon"]):
            return {"speak": "Hello Boss Rendo. How can I help you today?", "tool": None, "arguments": {}}

        return {
            "speak": "I heard you, but my AI providers are currently unavailable. Please check that Ollama is running.",
            "tool":  None,
            "arguments": {},
        }
