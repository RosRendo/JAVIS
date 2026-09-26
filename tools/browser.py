import webbrowser
import urllib.parse

WEBSITE_REGISTRY = {
    "facebook": "https://www.facebook.com/",
    "youtube": "https://www.youtube.com/",
    "discord": "https://discord.com/",
    "chatgpt": "https://chatgpt.com/",
    "instagram": "https://www.instagram.com/",
    "github": "https://github.com/",
    "dashboard": "http://localhost:5173/"
}

def open_website(name: str) -> dict:
    name_lower = name.lower()
    
    # Check registry
    url = None
    for key, val in WEBSITE_REGISTRY.items():
        if key in name_lower:
            url = val
            break
            
    if not url:
        # Check if they passed a custom URL
        if name_lower.startswith("http://") or name_lower.startswith("https://") or "." in name_lower:
            url = name if name_lower.startswith("http") else f"https://{name}"
        else:
            # Fallback to search google
            return search_google(name)
            
    try:
        webbrowser.open(url)
        return {"success": True, "message": f"Opened website: {url}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to open website {url}: {str(e)}"}

def search_google(query: str) -> dict:
    encoded_query = urllib.parse.quote(query)
    url = f"https://www.google.com/search?q={encoded_query}"
    try:
        webbrowser.open(url)
        return {"success": True, "message": f"Searched Google for: '{query}'"}
    except Exception as e:
        return {"success": False, "message": f"Failed to search Google: {str(e)}"}
