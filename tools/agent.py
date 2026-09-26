import os
import subprocess

def execute_terminal_command(command: str, cwd: str = None) -> dict:
    """
    Executes an arbitrary command in the Windows PowerShell shell.
    If cwd is not provided, defaults to the JARVIS root workspace.
    """
    if not cwd:
        cwd = os.getcwd()
    else:
        # Resolve relative path to absolute
        cwd = os.path.abspath(cwd)

    if not os.path.exists(cwd):
        return {"success": False, "message": f"Cwd directory does not exist: {cwd}"}

    try:
        # Use powershell on Windows
        process = subprocess.Popen(
            ["powershell.exe", "-Command", command],
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True
        )
        
        # We wait up to 4 seconds to see if it finishes quickly (e.g. dir, ping, short scripts)
        try:
            stdout, stderr = process.communicate(timeout=4.0)
            success = process.returncode == 0
            return {
                "success": success,
                "exit_code": process.returncode,
                "stdout": stdout,
                "stderr": stderr,
                "message": f"Command executed. Output returned."
            }
        except subprocess.TimeoutExpired:
            # If it takes longer than 4 seconds, it's likely a persistent server (e.g., npm run dev)
            # We let it run in the background
            return {
                "success": True,
                "message": f"Command launched and is running in the background.",
                "stdout": f"[Command started: {command}]",
                "stderr": ""
            }

    except Exception as e:
        return {"success": False, "message": f"Execution error: {str(e)}"}


def read_file(filepath: str) -> dict:
    """Reads the contents of a file on the system."""
    filepath = os.path.abspath(filepath)
    if not os.path.exists(filepath):
        return {"success": False, "message": f"File not found: {filepath}"}
    
    if os.path.isdir(filepath):
        return {"success": False, "message": f"{filepath} is a directory, not a file."}

    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        return {
            "success": True,
            "filepath": filepath,
            "content": content[:12000],  # Truncate if extremely large to prevent model context overload
            "message": f"Successfully read file: {os.path.basename(filepath)}"
        }
    except Exception as e:
        return {"success": False, "message": f"Failed to read file: {str(e)}"}


def write_file(filepath: str, content: str) -> dict:
    """Writes content to a file, creating directories if necessary."""
    filepath = os.path.abspath(filepath)
    
    try:
        dir_name = os.path.dirname(filepath)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)
            
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
            
        return {
            "success": True,
            "filepath": filepath,
            "message": f"Successfully wrote file: {os.path.basename(filepath)}"
        }
    except Exception as e:
        return {"success": False, "message": f"Failed to write file: {str(e)}"}
