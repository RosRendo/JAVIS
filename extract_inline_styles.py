with open("lovable_index.html", "r", encoding="utf-8") as f:
    html = f.read()

import re

style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL)
if style_blocks:
    with open("lovable_inline_styles.css", "w", encoding="utf-8") as f:
        f.write(style_blocks[0])
    print("Saved inline style block to lovable_inline_styles.css")
    
    # Print key lines (e.g. animation keyframes or root custom properties)
    lines = style_blocks[0].split("\n")
    print("Inline style lines count:", len(lines))
    print("Sample lines:")
    for line in lines[:40]:
        if line.strip():
            print(" ", line.strip()[:100])
else:
    print("No inline style block found.")
