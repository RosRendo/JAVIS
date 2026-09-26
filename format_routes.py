import re

with open("lovable_routes.js", "r", encoding="utf-8") as f:
    js_content = f.read()

# Let's search for "exchanges"
pattern = r'exchanges'
match = re.search(pattern, js_content)

if match:
    # Get a large window of text around the match
    start_idx = max(0, match.start() - 10000)
    end_idx = min(len(js_content), match.end() + 25000)
    
    snippet = js_content[start_idx:end_idx]
    
    # Simple formatter to make minified JS somewhat readable
    formatted = snippet.replace("};", "};\n").replace("{", "{\n").replace("}", "\n}").replace("const ", "\nconst ").replace("function ", "\nfunction ").replace("return ", "\nreturn ")
    
    with open("extracted_component.js", "w", encoding="utf-8") as out:
        out.write(formatted)
        
    print("Successfully extracted and formatted component code to extracted_component.js")
else:
    print("Keyword not found in JS!")
