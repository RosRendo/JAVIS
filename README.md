# 🤖 JARVIS — Modern Windows Desktop AI Assistant & Automation Cockpit

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend_Gateway-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![Ollama](https://img.shields.io/badge/Ollama-Offline_LLM-000000)
![Gemini](https://img.shields.io/badge/Google_Gemini-Multimodal_AI-8E75B2)
![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-f69220.svg?logo=pnpm)
![License](https://img.shields.io/badge/License-MIT-blue.svg)

**A modular, provider-agnostic Windows desktop AI assistant built with a Python FastAPI backend and a high-performance React 19 HUD frontend. Capable of local offline LLM reasoning (Ollama), cloud model routing (Gemini, Claude, GPT-4o), voice interaction, semantic memory recall, screen analysis, and desktop automation.**

[System Architecture](#-system-architecture) • [State Machine & ERD](#-state-machine--context-model) • [Interaction Flow](#-voice--tool-execution-flow) • [Quick Start](#-quick-start)

</div>

---

## ⚡ Overview

**JARVIS** transforms your Windows desktop into an autonomous, proactive AI workspace. Rather than locking you into a single proprietary API, JARVIS features an intelligent provider router that seamlessly switches between zero-latency local models (via **Ollama**) and powerful cloud models (**Gemini 2.5 Flash**, **Claude 3.5 Sonnet**, **GPT-4o**). It can see your screen, run system diagnostic tools, control windows, and speak responses with low-latency TTS.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph UIClient["🖥️ Frontend Desktop HUD (React 19 + Vite)"]
        Overlay["Floating Desktop HUD & Overlay"]
        VoiceOrb["Reactive Voice Audio Visualizer"]
        ToolPanel["Active System Tools & Quick Action Dock"]
        SettingsDrawer["Provider & Model Selection Drawer"]
        
        Overlay & VoiceOrb & ToolPanel & SettingsDrawer
    end

    subgraph APIGateway["⚡ FastAPI Python Backend Gateway"]
        WebSocketServer["Streaming WebSocket & SSE Server"]
        Router["Multi-Provider LLM Router"]
        SpeechEngine["Speech Processor (Whisper STT / Edge-TTS)"]
        MemoryManager["Semantic Vector Memory (ChromaDB / SQLite)"]
        ToolRegistry["System Tool & Automation Registry"]
        
        UIClient <--> WebSocketServer
        WebSocketServer <--> Router
        WebSocketServer <--> SpeechEngine
        Router <--> MemoryManager
        Router <--> ToolRegistry
    end

    subgraph LLMProviders["🧠 Multi-Provider Intelligence Tier"]
        LocalOllama["Ollama (Llama 3 / DeepSeek Local)"]
        Gemini["Google Gemini Pro / Flash"]
        Claude["Anthropic Claude 3.5 Sonnet"]
        OpenAI["OpenAI GPT-4o"]
        
        Router <--> LocalOllama & Gemini & Claude & OpenAI
    end

    subgraph SystemTools["⚙️ Windows Desktop Automation"]
        WinAutomation["Window Manager & Process Controller"]
        ScreenVision["Real-Time Desktop Screenshot Analyzer"]
        ShellExecutor["Secure PowerShell Command Runner"]
        
        ToolRegistry --> WinAutomation & ScreenVision & ShellExecutor
    end
```

---

## 📊 State Machine & Context Model

```mermaid
erDiagram
    SESSIONS ||--o{ MESSAGES : contains
    SESSIONS ||--o{ MEMORY_EMBEDDINGS : indexes
    MESSAGES ||--o{ TOOL_CALLS : triggers
    SYSTEM_CONFIG ||--o{ SESSIONS : configures

    SESSIONS {
        string id PK "UUID"
        string title
        string activeProvider "Ollama | Gemini | OpenAI | Claude"
        string activeModel
        datetime startedAt
        datetime updatedAt
    }

    MESSAGES {
        string id PK "UUID"
        string sessionId FK
        string role "user | assistant | system"
        text content
        string audioUrl
        datetime timestamp
    }

    MEMORY_EMBEDDINGS {
        string id PK "UUID"
        string sessionId FK
        text textChunk
        json embeddingVector
        string category "PREFERENCE | FACT | PROJECT | CLIPBOARD"
        datetime indexedAt
    }

    TOOL_CALLS {
        string id PK "UUID"
        string messageId FK
        string toolName "screenshot | open_app | run_powershell"
        json parameters
        json executionResult
        int status "SUCCESS | FAILED"
        datetime executedAt
    }

    SYSTEM_CONFIG {
        string id PK
        string hotkey
        boolean voiceWakeEnabled
        string defaultTtsVoice
        string whisperModel
    }
```

---

## 🔄 Voice & Tool Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Developer
    participant HUD as 🖥️ JARVIS React HUD
    participant Fast as ⚡ FastAPI Backend
    participant STT as 🎙️ Whisper STT Engine
    participant Router as 🧠 Multi-Provider LLM Router
    participant WinAPI as 🪟 Windows System Tools
    participant TTS as 🔊 Edge-TTS Engine

    User->>HUD: Speaks Query ("Analyze active window and summarize error")
    HUD->>Fast: Stream raw audio chunks via WebSocket
    Fast->>STT: Transcribe audio to text
    STT-->>Fast: "Analyze active window and summarize error"
    
    Fast->>Router: Query LLM with conversation history + tools
    Router->>WinAPI: Tool Call: `capture_active_window()`
    WinAPI-->>Router: Screenshot JPEG buffer
    
    Router->>Router: Multimodal Vision Analysis (Gemini Flash)
    Router-->>Fast: Generated explanation & terminal fix command
    
    Fast->>TTS: Synthesize voice response
    TTS-->>HUD: Audio stream playback
    Fast-->>HUD: WS Stream: Markdown text & interactive action button
    User->>HUD: Click "Run Fix" -> PowerShell executes command automatically
```

---

## 🚀 Quick Start

### 1. Python Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install Dependencies
pip install -r requirements.txt

# Run Backend
python run.py
```

### 2. Frontend Desktop HUD Setup
```bash
cd app/ui
pnpm install
pnpm run dev
```

Visit `http://localhost:5173` to open the JARVIS HUD.

---

## 📄 License
MIT License © **[Ros Rendo](https://github.com/RosRendo)**
