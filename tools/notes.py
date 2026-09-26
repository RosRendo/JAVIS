import os
from datetime import datetime

NOTES_DIR = "data/notes"

def create_note(title: str, content: str) -> dict:
    if not os.path.exists(NOTES_DIR):
        os.makedirs(NOTES_DIR, exist_ok=True)
        
    # Sanitize title for filename
    safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "_", "-")).rstrip()
    if not safe_title:
        safe_title = "note"
        
    filename = f"{safe_title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    filepath = os.path.join(NOTES_DIR, filename)
    
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"Title: {title}\nDate: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n{content}\n")
        return {"success": True, "filepath": filepath, "message": f"Note '{title}' saved successfully."}
    except Exception as e:
        return {"success": False, "message": f"Failed to save note: {str(e)}"}

def list_notes() -> dict:
    if not os.path.exists(NOTES_DIR) or not os.listdir(NOTES_DIR):
        return {"success": True, "notes": [], "message": "No notes found."}
        
    notes = []
    for file in os.listdir(NOTES_DIR):
        if file.endswith(".txt"):
            notes.append(file)
            
    return {"success": True, "notes": notes}

def read_note(filename: str) -> dict:
    filepath = os.path.join(NOTES_DIR, filename)
    if not os.path.exists(filepath):
        # Try listing and doing fuzzy match
        if not filename.endswith(".txt"):
            filepath += ".txt"
        if not os.path.exists(filepath):
            return {"success": False, "message": f"Note {filename} not found."}
            
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        return {"success": True, "content": content}
    except Exception as e:
        return {"success": False, "message": f"Failed to read note: {str(e)}"}
