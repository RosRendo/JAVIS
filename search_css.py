with open("lovable_styles.css", "r", encoding="utf-8") as f:
    css = f.read()

import re

variables = [
    "--glass", "--color-border", "--shadow-glass", 
    "--font-mono", "--hud-dim", "--core-hot", "--background", 
    "--foreground", "--muted-foreground", "--border"
]
print("CSS Variables:")
for var in variables:
    pattern = re.escape(var) + r"\s*:\s*([^;\}]+)"
    matches = re.findall(pattern, css)
    if matches:
        print(f"  {var}: {matches[0].strip()}")
    else:
        print(f"  {var}: NOT FOUND")
