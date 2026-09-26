import urllib.request

css_url = "https://future-interface-os.lovable.app/assets/styles-BY8y1sXa.css"
headers = {"User-Agent": "Mozilla/5.0"}

req = urllib.request.Request(css_url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        css_content = response.read().decode("utf-8")
        print("CSS length:", len(css_content))
        
        # Save to file
        with open("lovable_styles.css", "w", encoding="utf-8") as f:
            f.write(css_content)
        print("Saved raw CSS to lovable_styles.css")
        
        # Search for key CSS variables or structures
        import re
        root_vars = re.findall(r'--[a-zA-Z0-9_-]+:[^;]+;', css_content)
        print("\nRoot variables found count:", len(root_vars))
        for v in root_vars[:20]:
            print("-", v)
            
except Exception as e:
    print("Error fetching CSS:", e)
