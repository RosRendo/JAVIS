import json
import os
from datetime import datetime, timedelta

REMINDERS_FILE = "data/reminders.json"

def get_reminders() -> list:
    if not os.path.exists(REMINDERS_FILE):
        return []
    try:
        with open(REMINDERS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_reminders(reminders: list):
    db_dir = os.path.dirname(REMINDERS_FILE)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    with open(REMINDERS_FILE, "w") as f:
        json.dump(reminders, f, indent=2)

def set_reminder(text: str, delay_seconds: int) -> dict:
    trigger_time = (datetime.now() + timedelta(seconds=delay_seconds)).isoformat()
    reminders = get_reminders()
    
    new_reminder = {
        "id": len(reminders) + 1,
        "text": text,
        "trigger_time": trigger_time,
        "triggered": False
    }
    
    reminders.append(new_reminder)
    save_reminders(reminders)
    
    friendly_time = (datetime.now() + timedelta(seconds=delay_seconds)).strftime("%H:%M:%S")
    return {
        "success": True, 
        "message": f"Reminder set: '{text}' in {delay_seconds} seconds (at {friendly_time})"
    }

def check_pending_reminders() -> list:
    reminders = get_reminders()
    now = datetime.now().isoformat()
    triggered = []
    
    for r in reminders:
        if not r["triggered"] and r["trigger_time"] <= now:
            r["triggered"] = True
            triggered.append(r)
            
    if triggered:
        save_reminders(reminders)
        
    return triggered
