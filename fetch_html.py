import urllib.request
import re

url = "https://future-interface-os.lovable.app"
headers = {"User-Agent": "Mozilla/5.0"}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode("utf-8")
        print("HTML length:", len(html))
        
        # Save HTML
        with open("lovable_index.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("Saved raw HTML to lovable_index.html")
        
        # Find script and stylesheet tags
        scripts = re.findall(r'<script[^>]*src="([^"]+)"', html)
        stylesheets = re.findall(r'<link[^>]*href="([^"]+)"', html)
        
        print("\nScripts found:")
        for s in scripts:
            print("-", s)
            
        print("\nStylesheets found:")
        for css in stylesheets:
            print("-", css)
            
except Exception as e:
    print("Error:", e)
