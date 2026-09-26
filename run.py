import subprocess
import sys
import os
import time
import signal

def run():
    print("==================================================")
    print("          J A R V I S   A S S I S T A N T         ")
    print("             Launch Control Center                ")
    print("==================================================")
    
    # 1. Start FastAPI Backend
    print("\n[System] Starting FastAPI backend on port 8000...")
    backend_cmd = [sys.executable, "-m", "uvicorn", "assistant.app:app", "--host", "127.0.0.1", "--port", "8000"]
    try:
        backend_proc = subprocess.Popen(
            backend_cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
    except Exception as e:
        print(f"[Error] Failed to start backend: {e}")
        return

    # Give backend a moment to start port binding
    time.sleep(1.5)

    # 2. Start Vite Frontend
    print("[System] Starting React-TS Vite development server...")
    frontend_dir = os.path.join(os.getcwd(), "app", "ui")
    frontend_cmd = "npm run dev"
    try:
        # Use shell=True for npm on Windows
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=frontend_dir,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
    except Exception as e:
        print(f"[Error] Failed to start frontend: {e}")
        backend_proc.terminate()
        return

    # Define a helper function to read stream non-blockingly on a separate thread
    import threading
    
    def log_stream(proc, name):
        for line in iter(proc.stdout.readline, ''):
            if line:
                print(f"[{name}] {line.strip()}")
        proc.stdout.close()

    backend_thread = threading.Thread(target=log_stream, args=(backend_proc, "Backend"), daemon=True)
    frontend_thread = threading.Thread(target=log_stream, args=(frontend_proc, "Frontend"), daemon=True)
    
    backend_thread.start()
    frontend_thread.start()

    print("\n==================================================")
    print("  JARVIS launched successfully!")
    print("  - Backend API: http://localhost:8000")
    print("  - Frontend UI: http://localhost:5173")
    print("  Press Ctrl+C to terminate both servers cleanly.")
    print("==================================================\n")

    try:
        while True:
            # Check if either process died unexpectedly
            if backend_proc.poll() is not None:
                print(f"\n[System] Backend process exited with code {backend_proc.poll()}")
                break
            if frontend_proc.poll() is not None:
                print(f"\n[System] Frontend process exited with code {frontend_proc.poll()}")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[System] Shutdown signal received (Ctrl+C). Terminating processes...")
    finally:
        # Clean termination of subprocesses
        try:
            # Kill frontend
            if frontend_proc.poll() is None:
                if os.name == 'nt':
                    # Windows taskkill to ensure sub-processes spawned by npm are also terminated
                    subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    frontend_proc.terminate()
            # Kill backend
            if backend_proc.poll() is None:
                if os.name == 'nt':
                    subprocess.run(f"taskkill /F /T /PID {backend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    backend_proc.terminate()
            print("[System] Both servers stopped successfully. Goodbye!")
        except Exception as e:
            print(f"[Error] Error during cleanup: {e}")

if __name__ == "__main__":
    run()
