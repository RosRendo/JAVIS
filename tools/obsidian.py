"""
Obsidian vault tool for JARVIS.

Reads vault_path from config/settings.json → obsidian.vault_path.
If vault_path is empty, falls back to vault/ inside the JARVIS project root
so the tool is always functional even without a real Obsidian installation.

Notes are plain Markdown files compatible with Obsidian, Notion imports,
or any text editor.
"""

import os
import json
from datetime import datetime


def _get_vault_path(config_path: str = "config/settings.json") -> str:
    """Return configured vault path, or default to ./vault/ in project root."""
    try:
        with open(config_path, "r") as f:
            cfg = json.load(f)
        path = cfg.get("obsidian", {}).get("vault_path", "").strip()
        if path:
            return path
    except Exception:
        pass
    # Default: local vault folder inside the JARVIS project
    return os.path.join(os.getcwd(), "vault")


def create_vault_note(title: str, content: str, folder: str = "Inbox") -> dict:
    """
    Write a Markdown note to <vault_path>/<folder>/<title>.md

    Args:
        title:   Note title (becomes filename)
        content: Markdown body of the note
        folder:  Subdirectory inside the vault (default: Inbox)
    """
    vault = _get_vault_path()
    note_dir = os.path.join(vault, folder)

    try:
        os.makedirs(note_dir, exist_ok=True)
    except Exception as e:
        return {"success": False, "message": f"Could not create vault folder '{folder}': {e}"}

    # Sanitise title → safe filename
    safe_title = "".join(c for c in title if c.isalnum() or c in " _-()").strip()
    if not safe_title:
        safe_title = f"note_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    filepath = os.path.join(note_dir, f"{safe_title}.md")

    # Build Markdown with YAML front-matter
    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M")
    markdown = (
        f"---\n"
        f"title: {title}\n"
        f"created: {now_iso}\n"
        f"folder: {folder}\n"
        f"---\n\n"
        f"# {title}\n\n"
        f"{content}\n"
    )

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(markdown)
        return {
            "success": True,
            "filepath": filepath,
            "message": f"Vault note '{safe_title}.md' saved in {folder}.",
        }
    except Exception as e:
        return {"success": False, "message": f"Failed to write vault note: {e}"}


def list_vault_notes(folder: str = "") -> dict:
    """
    List Markdown files in <vault_path>/<folder>.
    If folder is empty, lists the top-level vault directory.
    """
    vault = _get_vault_path()
    target = os.path.join(vault, folder) if folder else vault

    if not os.path.exists(target):
        return {
            "success": True,
            "notes": [],
            "message": f"Vault folder '{folder or 'root'}' does not exist yet.",
        }

    notes = []
    for root, _, files in os.walk(target):
        for f in files:
            if f.endswith(".md"):
                rel = os.path.relpath(os.path.join(root, f), vault)
                notes.append(rel.replace("\\", "/"))

    if not notes:
        return {"success": True, "notes": [], "message": "No notes found in that folder."}

    return {
        "success": True,
        "notes": notes,
        "message": f"Found {len(notes)} note(s).",
    }


def sync_memories_to_obsidian(memories: list):
    """
    Sync list of memory dicts to the Obsidian vault.
    Creates <vault_path>/Memories/<key>.md for each, and maps them to a central <vault_path>/Memories.md index.
    """
    vault = _get_vault_path()
    if not vault or not os.path.exists(vault):
        print(f"[Obsidian Sync] Vault path '{vault}' does not exist. Skipping sync.")
        return

    memories_folder = os.path.join(vault, "Memories")
    try:
        os.makedirs(memories_folder, exist_ok=True)
    except Exception as e:
        print(f"[Obsidian Sync] Failed to create Memories folder: {e}")
        return

    # 1. Create notes for all memories
    for mem in memories:
        key = mem["key"]
        value = mem["value"]

        # Sanitise title
        safe_title = "".join(c for c in key if c.isalnum() or c in " _-()").strip()
        if not safe_title:
            continue

        filepath = os.path.join(memories_folder, f"{safe_title}.md")
        now_iso = datetime.now().strftime("%Y-%m-%d %H:%M")
        markdown = (
            f"---\n"
            f"type: memory\n"
            f"key: \"{key}\"\n"
            f"created: {now_iso}\n"
            f"---\n\n"
            f"# {key}\n\n"
            f"{value}\n\n"
            f"Related: [[Memories]]\n"
        )
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(markdown)
        except Exception as e:
            print(f"[Obsidian Sync] Failed to write memory note '{safe_title}': {e}")

    # 2. Re-create the Memories.md index file at the root of the vault
    index_path = os.path.join(vault, "Memories.md")
    index_markdown = (
        f"# JARVIS Memories\n\n"
        f"All long-term facts remembered by JARVIS are linked below:\n\n"
    )
    for mem in sorted(memories, key=lambda m: m["key"]):
        index_markdown += f"- [[{mem['key']}]]\n"

    try:
        with open(index_path, "w", encoding="utf-8") as f:
            f.write(index_markdown)
        print(f"[Obsidian Sync] Successfully synced {len(memories)} memories to vault at '{vault}'.")
    except Exception as e:
        print(f"[Obsidian Sync] Failed to update Memories index file: {e}")
