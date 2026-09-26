import urllib.request
import re

js_url = "https://future-interface-os.lovable.app/assets/routes-BCmJN2n6.js"
headers = {"User-Agent": "Mozilla/5.0"}

req = urllib.request.Request(js_url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        js_content = response.read().decode("utf-8")
        print("JS length:", len(js_content))
        
        # Save JS
        with open("lovable_routes.js", "w", encoding="utf-8") as f:
            f.write(js_content)
        print("Saved raw JS to lovable_routes.js")
        
        # Let's search for interesting strings in the JS content
        print("\nSearching for text elements:")
        keywords = ["exchanges", "Session", "cpu", "ram", "hey jarvis", "voice profile", "ctrl + space"]
        for kw in keywords:
            matches = [m.start() for m in re.finditer(kw, js_content, re.IGNORECASE)]
            print(f"- '{kw}': found {len(matches)} matches")
            for idx in matches[:2]:
                start = max(0, idx - 100)
                end = min(len(js_content), idx + 100)
                print(f"  Context: ... {js_content[start:end]} ...")
                
except Exception as e:
    print("Error fetching JS:", e)
