import psutil
import pyautogui
import os
from datetime import datetime

def get_system_status() -> dict:
    cpu_usage = psutil.cpu_percent(interval=0.1)
    ram = psutil.virtual_memory()
    ram_usage = ram.percent
    
    battery = psutil.sensors_battery()
    battery_percentage = battery.percent if battery else None
    power_plugged = battery.power_plugged if battery else None
    
    # Generate a friendly summary
    status_summary = f"CPU is at {cpu_usage}%, RAM is at {ram_usage}%."
    if battery_percentage is not None:
        status_summary += f" Battery is at {battery_percentage}% ({'charging' if power_plugged else 'discharging'})."
        
    return {
        "cpu_percent": cpu_usage,
        "ram_percent": ram_usage,
        "battery_percent": battery_percentage,
        "battery_plugged": power_plugged,
        "summary": status_summary
    }

def control_volume(action: str) -> dict:
    action_lower = action.lower()
    if "up" in action_lower or "increase" in action_lower:
        pyautogui.press("volumeup")
        return {"success": True, "message": "Volume increased"}
    elif "down" in action_lower or "decrease" in action_lower:
        pyautogui.press("volumedown")
        return {"success": True, "message": "Volume decreased"}
    elif "mute" in action_lower or "toggle" in action_lower:
        pyautogui.press("volumemute")
        return {"success": True, "message": "Volume muted/toggled"}
    else:
        return {"success": False, "message": f"Unknown volume action: {action}"}

def take_screenshot(save_dir="data/screenshots") -> dict:
    if not os.path.exists(save_dir):
        os.makedirs(save_dir, exist_ok=True)
        
    filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    filepath = os.path.join(save_dir, filename)
    
    try:
        screenshot = pyautogui.screenshot()
        screenshot.save(filepath)
        # Also open it to show the user
        os.startfile(filepath)
        return {"success": True, "filepath": filepath, "message": f"Screenshot taken and saved as {filename}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to take screenshot: {str(e)}"}
