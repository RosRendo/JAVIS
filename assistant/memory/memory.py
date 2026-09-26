import sqlite3
import os
import json
from datetime import datetime

class JarvisMemory:
    def __init__(self, db_path="data/jarvis.db"):
        self.db_path = db_path
        # Ensure database directory exists
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            # 1. Key-value Memory table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    created_at TEXT,
                    updated_at TEXT
                )
            """)
            # 2. Chat history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT,
                    content TEXT,
                    timestamp TEXT
                )
            """)
            # 3. Tool execution logs table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tool_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tool_name TEXT,
                    arguments TEXT,
                    result TEXT,
                    timestamp TEXT
                )
            """)
            conn.commit()

    # Key-value memories
    def get_memory(self, key):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM memories WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row[0] if row else None

    def set_memory(self, key, value):
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO memories (key, value, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value = excluded.value,
                    updated_at = excluded.updated_at
            """, (key, value, now, now))
            conn.commit()

    def delete_memory(self, key):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM memories WHERE key = ?", (key,))
            conn.commit()

    def list_all_memories(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT key, value, updated_at FROM memories ORDER BY updated_at DESC")
            return [{"key": row[0], "value": row[1], "updated_at": row[2]} for row in cursor.fetchall()]

    # Chat history
    def add_chat_msg(self, role, content):
        now = datetime.now().isoformat()
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO history (role, content, timestamp) VALUES (?, ?, ?)", (role, content, now))
            conn.commit()

    def get_chat_history(self, limit=50):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT role, content, timestamp FROM history ORDER BY id DESC LIMIT ?", (limit,))
            # Reverse to get chronological order
            rows = cursor.fetchall()
            rows.reverse()
            return [{"role": row[0], "content": row[1], "timestamp": row[2]} for row in rows]

    def clear_chat_history(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM history")
            conn.commit()

    # Tool logs
    def log_tool_execution(self, tool_name, arguments, result):
        now = datetime.now().isoformat()
        args_str = json.dumps(arguments) if isinstance(arguments, (dict, list)) else str(arguments)
        res_str = json.dumps(result) if isinstance(result, (dict, list)) else str(result)
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO tool_logs (tool_name, arguments, result, timestamp)
                VALUES (?, ?, ?, ?)
            """, (tool_name, args_str, res_str, now))
            conn.commit()

    def get_tool_logs(self, limit=20):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT tool_name, arguments, result, timestamp FROM tool_logs ORDER BY id DESC LIMIT ?", (limit,))
            return [{"tool_name": row[0], "arguments": row[1], "result": row[2], "timestamp": row[3]} for row in cursor.fetchall()]
