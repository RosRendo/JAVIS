with open("lovable_index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re

# Print title, meta, body classes, etc.
title = re.findall(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE)
body = re.findall(r'<body[^>]*>', html, re.IGNORECASE)

print("Title:", title)
print("Body tag:", body)

# Check if there are any inline style blocks or scripts
style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL)
print("Style blocks count:", len(style_blocks))
if style_blocks:
    print("First 200 chars of style block:", style_blocks[0][:200])
