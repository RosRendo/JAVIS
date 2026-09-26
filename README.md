# JARVIS — Modern Windows Desktop Assistant

A modular, provider-agnostic AI desktop assistant built with a **Python FastAPI backend** and a **React + TypeScript (Vite) frontend**.

---

## Architecture

```
                         JARVIS
                            │
             ┌──────────────┴──────────────┐
             │                             │
        React UI                       AI Gateway
        Vite + TS                          │
             │                 ┌───────────┼───────────┐
             │              Ollama       Gemini      OpenAI / Anthropic
             │
        WebSocket ──────────────────────────────────────┐
                                                        │
                                                  FastAPI Core
                                                        │
                                          ┌─────────────┼─────────────┐
                                          │             │             │
                                        Voice        Memory         Tools
                                          │             │             │
                                   ┌──────┤           SQLite    ┌────────────┐
                                   │      │                     │ Apps       │
                                  STT    TTS                    │ Browser    │
                               (Whisper) (pyttsx3/              │ System     │
                                          edge-tts)             │ Notes      │
                                        Wake Word               │ Reminders  │
                                                                │ Obsidian ← │
                                                                └────────────┘
```

### Key design decisions

| Layer | Choice | Reason |
|-------|--------|--------|
| AI Gateway | Provider-agnostic abstraction | Switch Ollama → OpenAI → Gemini without changing UI or tools |
| Memory | SQLite | Fast, offline, zero dependencies |
| Knowledge | Obsidian-compatible Markdown | Human-readable, syncs with real Obsidian vaults |
| UI | React + Framer Motion | Animated orb states, live WebSocket data feeds |

---

## Features

- **AI Gateway** — Routes to any configured provider. Fallback chain: Ollama → any provider with a key → rule-based fallback. Never crashes silently.
- **Voice Pipeline** — Wake-word detection, STT (Google or faster-whisper), TTS (pyttsx3 or edge-tts).
- **Controlled Tools** — The LLM never runs arbitrary code. It outputs a JSON block; the tool router validates and executes it.
- **Obsidian Knowledge Vault** — JARVIS can create `.md` notes in your Obsidian vault (or a local `vault/` folder).
- **SQLite Memory** — Key-value facts, conversation history, and tool execution logs.
- **Cybernetic Dashboard** — Framer Motion animated orb (Idle / Listening / Thinking / Speaking), live system stats, chat history, memory viewer.

---

## Getting Started

### 1. Install Python dependencies

```bash
pip install fastapi uvicorn websockets psutil pyautogui SpeechRecognition pyttsx3 requests
```

Optional providers (install only what you use):
```bash
pip install openai                   # OpenAI
pip install google-generativeai      # Gemini
pip install anthropic                # Claude
pip install faster-whisper           # Local STT (replaces Google)
```

### 2. Install frontend dependencies

```bash
cd app/ui
npm install
```

### 3. Configure `config/settings.json`

```json
{
  "ai": {
    "provider": "ollama",
    "providers": {
      "ollama":    { "url": "http://localhost:11434", "model": "llama3.2" },
      "openai":    { "api_key": "sk-...", "model": "gpt-4o-mini" },
      "gemini":    { "api_key": "AI...",  "model": "gemini-1.5-flash" },
      "anthropic": { "api_key": "sk-...", "model": "claude-3-haiku-20240307" }
    }
  },
  "stt": { "provider": "google" },
  "tts": { "provider": "pyttsx3" },
  "obsidian": { "vault_path": "D:\\Obsidian\\MyVault" }
}
```

- Set `ai.provider` to whichever provider you want as primary.
- Leave `api_key` empty for providers you don't use — they are automatically skipped.
- Set `obsidian.vault_path` to your Obsidian vault folder. Leave empty to use a local `vault/` folder.

### 4. (Optional) Install and run Ollama

```bash
# Download from https://ollama.com
ollama run llama3.2
```

### 5. Launch JARVIS

```bash
python run.py
```

This starts:
- **Backend**: `http://localhost:8000`
- **Frontend**: `http://localhost:5173`

---

## Switching AI Providers

Change one line in `config/settings.json`:

```json
"ai": { "provider": "gemini" }
```

No code changes needed. The gateway automatically picks up the new provider on next startup.

---

## Memory vs. Knowledge

| Store | Location | Purpose |
|-------|----------|---------|
| SQLite (`data/jarvis.db`) | Runtime memory | Fast lookups, conversation history, tool logs |
| Vault (`vault/` or Obsidian) | Markdown files | Human-readable notes, project docs, long-form knowledge |

**Example commands:**
- *"Remember that my Service Finder backend uses NestJS."* → Saved to SQLite.
- *"Create an Obsidian note about my Service Finder architecture."* → Creates `vault/Projects/Service Finder Architecture.md`.

---

## Project Structure

```
JARVIS/
├── assistant/
│   ├── app.py              # FastAPI + WebSocket server
│   ├── brain/
│   │   ├── gateway.py      # AI Gateway (Ollama / OpenAI / Gemini / Anthropic)
│   │   └── brain.py        # Orchestrator: prompt builder + response parser
│   ├── speech/speech.py    # STT + TTS pipeline
│   ├── wakeword/wakeword.py
│   └── memory/memory.py    # SQLite interface
├── tools/
│   ├── applications.py
│   ├── browser.py
│   ├── system.py
│   ├── notes.py
│   ├── reminders.py
│   └── obsidian.py         # Obsidian vault integration
├── app/ui/                 # Vite + React + TypeScript dashboard
├── config/settings.json    # All configuration in one file
├── data/jarvis.db          # Runtime SQLite database
├── vault/                  # Local Markdown knowledge base (Obsidian-compatible)
└── run.py                  # Unified launcher
```
