import os
import sys
import json
import asyncio
import threading
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add current workspace to path to resolve imports correctly
sys.path.append(os.getcwd())

from assistant.memory.memory import JarvisMemory
from assistant.speech.speech import SpeechPipeline
from assistant.brain.brain import JarvisBrain
from assistant.wakeword.wakeword import WakeWordListener

# Import tools
from tools.applications import open_application, close_application
from tools.browser import open_website, search_google
from tools.system import get_system_status, control_volume, take_screenshot
from tools.notes import create_note, list_notes, read_note
from tools.reminders import set_reminder, check_pending_reminders
from tools.obsidian import create_vault_note, list_vault_notes
from tools.agent import execute_terminal_command, read_file, write_file

app = FastAPI(title="JARVIS Assistant API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Instances
memory = JarvisMemory()
speech = SpeechPipeline()
brain = JarvisBrain(memory_instance=memory)

# Trigger Obsidian Sync on startup
try:
    from tools.obsidian import sync_memories_to_obsidian
    all_mems = memory.list_all_memories()
    if all_mems:
        sync_memories_to_obsidian(all_mems)
except Exception as e:
    print(f"Failed to run startup Obsidian sync: {e}")

# State variable
current_state = "IDLE"  # IDLE, LISTENING, THINKING, SPEAKING
state_lock = threading.Lock()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        # Send initial state on connection
        await websocket.send_json({"type": "state", "value": current_state})

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()
main_loop = None

def set_state(new_state):
    global current_state
    with state_lock:
        current_state = new_state
    print(f"[State Change] -> {new_state}")
    # Broadcast state change to UI asynchronously
    if main_loop:
        asyncio.run_coroutine_threadsafe(manager.broadcast({"type": "state", "value": new_state}), main_loop)

# Execute tools dynamically based on brain's response
def execute_tool(tool_name: str, args: dict) -> dict:
    try:
        # Normalize tool names
        t_name = tool_name.strip().lower().replace(" ", "_")
        
        if t_name in ["open_application", "open_app"]:
            return open_application(args.get("name", ""))
        elif t_name in ["close_application", "close_app"]:
            return close_application(args.get("name", ""))
        elif t_name in ["open_website", "open_web"]:
            return open_website(args.get("name", ""))
        elif t_name == "execute_terminal_command":
            return execute_terminal_command(args.get("command", ""), args.get("cwd", None))
        elif t_name == "read_file":
            return read_file(args.get("filepath", ""))
        elif t_name == "write_file":
            return write_file(args.get("filepath", ""), args.get("content", ""))
        elif t_name in ["search_google", "search"]:
            return search_google(args.get("query", ""))
        elif t_name in ["get_system_status", "system_status", "get_status"]:
            return get_system_status()
        elif t_name == "control_volume":
            return control_volume(args.get("action", ""))
        elif t_name == "take_screenshot":
            return take_screenshot()
        elif t_name == "create_note":
            return create_note(args.get("title", ""), args.get("content", ""))
        elif t_name == "list_notes":
            return list_notes()
        elif t_name == "read_note":
            return read_note(args.get("filename", ""))
        elif t_name == "set_reminder":
            return set_reminder(args.get("text", ""), int(args.get("delay_seconds", 10)))
        elif t_name == "save_memory":
            key = args.get("key", "")
            value = args.get("value", "")
            memory.set_memory(key, value)
            
            # Sync to Obsidian
            try:
                from tools.obsidian import sync_memories_to_obsidian
                all_mems = memory.list_all_memories()
                sync_memories_to_obsidian(all_mems)
            except Exception as e:
                print(f"Failed to sync memory to Obsidian: {e}")
                
            return {"success": True, "message": f"Saved fact: {key} = {value} (Synced to Obsidian)"}
        elif t_name == "create_vault_note":
            return create_vault_note(args.get("title", ""), args.get("content", ""), args.get("folder", "Inbox"))
        elif t_name == "list_vault_notes":
            return list_vault_notes(args.get("folder", ""))
        else:
            return {"success": False, "message": f"Tool '{tool_name}' not recognized"}
    except Exception as e:
        return {"success": False, "message": f"Error running tool: {str(e)}"}

# Voice interaction pipeline loop
def run_voice_cycle():
    # If already doing something, ignore
    global current_state
    if current_state != "IDLE":
        return
        
    try:
        set_state("LISTENING")
        speech.speak("Yes, Boss?")
        
        # Listen to speech
        user_input = speech.listen_and_transcribe(state_callback=set_state)
        
        if user_input and user_input != "None":
            # Send speech transcript to UI
            if main_loop:
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({"type": "transcript", "value": user_input}), 
                    main_loop
                )
            
            set_state("THINKING")
            
            # Send to brain
            brain_response = brain.query(user_input)
            
            # Execute tool if present and not None
            tool_result = None
            if brain_response.get("tool"):
                tool_name = brain_response["tool"]
                tool_args = brain_response.get("arguments", {})
                
                # Execute tool
                tool_result = execute_tool(tool_name, tool_args)
                memory.log_tool_execution(tool_name, tool_args, tool_result)
                
                # Broadcast tool execution event to UI
                if main_loop:
                    asyncio.run_coroutine_threadsafe(
                        manager.broadcast({
                            "type": "tool_executed", 
                            "tool": tool_name, 
                            "arguments": tool_args, 
                            "result": tool_result
                        }),
                        main_loop
                    )
                
                # Format final text based on tool result
                response_text = tool_result.get("message", f"Executed {tool_name}")
            else:
                response_text = brain_response.get("speak", "I didn't catch that.")
                
            set_state("SPEAKING")
            
            # Send response message to UI
            if main_loop:
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({"type": "response", "value": response_text}),
                    main_loop
                )
            
            # Speak response
            speech.speak(response_text)
            # Add to history
            memory.add_chat_msg("assistant", response_text)
            
    except Exception as e:
        print(f"Error in voice interaction cycle: {e}")
    finally:
        set_state("IDLE")

# Wake word callback
def on_wake_word(text=None):
    # Only run voice cycle if we're idle
    if current_state == "IDLE":
        if text:
            # If text was already transcribed in always-listen mode, query directly
            threading.Thread(target=lambda: run_manual_query_cycle(text), daemon=True).start()
        else:
            # Otherwise run full greeting + listen cycle
            threading.Thread(target=run_voice_cycle, daemon=True).start()

# Initialize wake word listener
wakeword_listener = WakeWordListener(
    wake_word=brain.gateway.config.get("wake_word", "hey jarvis"),
    on_detect_callback=on_wake_word,
    always_listen=brain.gateway.config.get("always_listen", False),
    state_check_callback=lambda: current_state
)

# Background thread to push system status metrics and check reminders
def background_monitor():
    while True:
        try:
            # 1. System stats
            stats = get_system_status()
            if main_loop:
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({"type": "system_status", "value": stats}),
                    main_loop
                )
            
            # 2. Check pending reminders
            triggered = check_pending_reminders()
            for rem in triggered:
                msg = f"Reminder: {rem['text']}"
                if main_loop:
                    asyncio.run_coroutine_threadsafe(
                        manager.broadcast({"type": "reminder_trigger", "value": msg}),
                        main_loop
                    )
                speech.speak(msg)
                
        except Exception as e:
            print(f"Error in background monitor: {e}")
        time.sleep(3.0)

# FastAPI Startup
@app.on_event("startup")
def startup_event():
    global main_loop
    main_loop = asyncio.get_running_loop()
    # Start wake word listener
    wakeword_listener.start()
    # Start background metrics monitor
    threading.Thread(target=background_monitor, daemon=True).start()
    print("JARVIS Backend loaded and running.")

@app.on_event("shutdown")
def shutdown_event():
    wakeword_listener.stop()

# WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Broadcast the current always_listen setting to the newly connected UI
    await websocket.send_json({
        "type": "always_listen",
        "value": wakeword_listener.always_listen
    })
    try:
        while True:
            # Keep connection alive and receive incoming manual commands
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "trigger_listen":
                # Manual trigger listening from UI button
                on_wake_word()
            elif message.get("type") == "toggle_always_listen":
                # Toggle always_listen value dynamically
                new_val = not wakeword_listener.always_listen
                wakeword_listener.always_listen = new_val
                
                # Persist to settings.json
                try:
                    config_path = "config/settings.json"
                    with open(config_path, "r") as f:
                        config_data = json.load(f)
                    config_data["always_listen"] = new_val
                    with open(config_path, "w") as f:
                        json.dump(config_data, f, indent=2)
                except Exception as e:
                    print(f"Failed to persist always_listen to settings.json: {e}")
                
                # Broadcast the updated state to all connected clients
                await manager.broadcast({
                    "type": "always_listen",
                    "value": new_val
                })
            elif message.get("type") == "query":
                # Manual text query sent from chat input
                query_text = message.get("value")
                if query_text:
                    threading.Thread(
                        target=lambda: run_manual_query_cycle(query_text), 
                        daemon=True
                    ).start()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

def run_manual_query_cycle(query_text: str):
    global current_state
    if current_state != "IDLE":
        return
        
    try:
        set_state("THINKING")
        
        # Broadcast user's query
        if main_loop:
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "transcript", "value": query_text}), 
                main_loop
            )
        
        brain_response = brain.query(query_text)
        
        # Tool execution if present and not None
        if brain_response.get("tool"):
            tool_name = brain_response["tool"]
            tool_args = brain_response.get("arguments", {})
            tool_result = execute_tool(tool_name, tool_args)
            memory.log_tool_execution(tool_name, tool_args, tool_result)
            
            if main_loop:
                asyncio.run_coroutine_threadsafe(
                    manager.broadcast({
                        "type": "tool_executed", 
                        "tool": tool_name, 
                        "arguments": tool_args, 
                        "result": tool_result
                    }),
                    main_loop
                )
            response_text = tool_result.get("message", f"Executed {tool_name}")
        else:
            response_text = brain_response.get("speak", "Sorry, I had trouble processing that.")
            
        set_state("SPEAKING")
        if main_loop:
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "response", "value": response_text}),
                main_loop
            )
        speech.speak(response_text)
        memory.add_chat_msg("assistant", response_text)
        
    except Exception as e:
        print(f"Error in manual query cycle: {e}")
    finally:
        set_state("IDLE")

# HTTP Endpoints
@app.get("/api/history")
def get_history():
    return memory.get_chat_history(limit=50)

@app.get("/api/memories")
def get_memories():
    return memory.list_all_memories()

@app.get("/api/logs")
def get_logs():
    return memory.get_tool_logs(limit=20)

class QueryModel(BaseModel):
    query: str

@app.post("/api/query")
def trigger_query(payload: QueryModel):
    on_wake_word()
    return {"status": "triggered"}
