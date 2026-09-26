import os
import subprocess
import psutil

# Map common name keywords to (executable_path, process_name)
APP_REGISTRY = {
    "notepad": ("C:\\Windows\\System32\\notepad.exe", "notepad.exe"),
    "god": ("D:\\Steam\\Steamapps\\common\\God of War Ragnarok\\GoWR.exe", "GoWR.exe"),
    "god of war": ("D:\\Steam\\Steamapps\\common\\God of War Ragnarok\\GoWR.exe", "GoWR.exe"),
    "ark survival": ("D:\\Steam\\Steamapps\\common\\ARK\\ShooterGame\\Binaries\\Win64\\ShooterGame.exe", "ShooterGame.exe"),
    "chrome": ("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "chrome.exe"),
    "vscode": ("C:\\Users\\ROS RENDO\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", "Code.exe"),
    "vs code": ("C:\\Users\\ROS RENDO\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", "Code.exe")
}

def open_application(name: str) -> dict:
    name_lower = name.lower()
    
    # Try registry first
    matched_app = None
    for key, val in APP_REGISTRY.items():
        if key in name_lower:
            matched_app = val
            break
            
    if matched_app:
        path, proc_name = matched_app
        if os.path.exists(path):
            try:
                os.startfile(path)
                return {"success": True, "message": f"Opened {name} from {path}"}
            except Exception as e:
                return {"success": False, "message": f"Failed to start {name}: {str(e)}"}
        else:
            # Try to start it as command line command
            try:
                subprocess.Popen(proc_name, shell=True)
                return {"success": True, "message": f"Started {name} via shell command"}
            except Exception as e:
                return {"success": False, "message": f"File path for {name} does not exist: {path}"}
    else:
        # Generic try-run
        try:
            subprocess.Popen(name_lower, shell=True)
            return {"success": True, "message": f"Attempted to start {name} via shell command"}
        except Exception as e:
            return {"success": False, "message": f"Unknown application: {name}"}

def close_application(name: str) -> dict:
    name_lower = name.lower()
    
    matched_proc = None
    for key, val in APP_REGISTRY.items():
        if key in name_lower:
            matched_proc = val[1]
            break
            
    if not matched_proc:
        # Fallback to name as process name
        matched_proc = name_lower if name_lower.endswith(".exe") else f"{name_lower}.exe"
        
    killed_count = 0
    for proc in psutil.process_iter(['name']):
        try:
            if proc.info['name'] and proc.info['name'].lower() == matched_proc.lower():
                proc.kill()
                killed_count += 1
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
            
    if killed_count > 0:
        return {"success": True, "message": f"Closed {killed_count} instances of {name} ({matched_proc})"}
    else:
        return {"success": False, "message": f"No running instance of {name} ({matched_proc}) was found"}
