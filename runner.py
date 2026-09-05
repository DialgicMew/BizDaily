#!/usr/bin/env python3
"""
Runner script for bizDaily application.
Starts both backend and frontend services simultaneously.

Usage:
    python runner.py

To stop: Press Ctrl+C and both services will be terminated gracefully.
"""

import os
import sys
import signal
import socket
import subprocess
import time
from pathlib import Path

BACKEND_PORT = 4010
FRONTEND_PORT = 4011


def port_owner(port):
    """Return a short description of whatever is already listening on `port`, or None if it's free."""
    try:
        result = subprocess.run(
            ["lsof", "-iTCP", f":{port}", "-sTCP:LISTEN", "-n", "-P"],
            capture_output=True, text=True, timeout=3
        )
        lines = [l for l in result.stdout.splitlines()[1:] if l.strip()]
        if lines:
            parts = lines[0].split()
            return f"PID {parts[1]} ({parts[0]})"
    except Exception:
        pass
    # Fall back to a plain socket probe if lsof isn't available
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(("127.0.0.1", port)) == 0:
            return "an unknown process"
    return None


class BizDailyRunner:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.base_dir = Path(__file__).parent.absolute()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
   
    def _signal_handler(self, signum, frame):
        """Handle interrupt signals and cleanup processes."""
        print(f"\n🛑 Received signal {signum}. Shutting down...")
        self.stop_all()
        sys.exit(0)
    
    def start_backend(self):
        """Start the backend server."""
        backend_dir = self.base_dir / "backend"

        owner = port_owner(BACKEND_PORT)
        if owner:
            print(f"❌ Port {BACKEND_PORT} is already in use by {owner}.")
            print(f"   Stop whatever's using it (or free port {BACKEND_PORT}) and try again.")
            return False

        venv_python = None
        for venv_name in ("venv", ".venv", "venv_new"):
            candidate = backend_dir / venv_name / "bin" / "python"
            if candidate.exists():
                venv_python = candidate
                break

        if venv_python is None:
            print(f"❌ No virtual environment found in {backend_dir}")
            print("   Please create one first:")
            print(f"   cd {backend_dir} && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
            return False

        if not (backend_dir / ".env").exists():
            print(f"⚠️  No .env found in {backend_dir} — copy backend/.env.example to backend/.env and fill in")
            print("   OPENAI_API_KEY and DATABASE_URL first, or the backend will fail to start.")

        try:
            print(f"🚀 Starting backend server from {backend_dir}...")
            self.backend_process = subprocess.Popen(
                [str(venv_python), "run.py"],
                cwd=str(backend_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1,
                start_new_session=True,  # own process group, so we can kill its child processes too
            )
            return True
        except Exception as e:
            print(f"❌ Failed to start backend: {e}")
            return False
    
    def start_frontend(self):
        """Start the frontend development server."""
        frontend_dir = self.base_dir / "frontend"

        owner = port_owner(FRONTEND_PORT)
        if owner:
            print(f"❌ Port {FRONTEND_PORT} is already in use by {owner}.")
            print(f"   Stop whatever's using it (or free port {FRONTEND_PORT}) and try again.")
            return False

        try:
            print(f"🎨 Starting frontend server from {frontend_dir}...")
            self.frontend_process = subprocess.Popen(
                ["npm", "start"],
                cwd=str(frontend_dir),
                env={**os.environ, "PORT": str(FRONTEND_PORT)},
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1,
                # npm forks the actual react-scripts/node process as a child of itself;
                # without its own process group, killing "npm" leaves that child running
                # and squatting on port 4011 the next time this script runs.
                start_new_session=True,
            )
            return True
        except Exception as e:
            print(f"❌ Failed to start frontend: {e}")
            return False
    
    def stop_all(self):
        """Stop all running processes."""
        processes_to_stop = [
            ("Backend", self.backend_process),
            ("Frontend", self.frontend_process)
        ]
        
        for name, process in processes_to_stop:
            if process and process.poll() is None:  # Process is still running
                print(f"🔄 Stopping {name}...")
                try:
                    # Signal the whole process group (see start_new_session above),
                    # not just the direct child — npm/uvicorn both spawn children of
                    # their own that terminate() alone would otherwise orphan.
                    pgid = os.getpgid(process.pid)
                    try:
                        os.killpg(pgid, signal.SIGTERM)
                        process.wait(timeout=5)
                        print(f"✅ {name} stopped gracefully")
                    except subprocess.TimeoutExpired:
                        print(f"⚠️  {name} didn't stop gracefully, forcing...")
                        os.killpg(pgid, signal.SIGKILL)
                        process.wait()
                        print(f"✅ {name} force-stopped")
                except ProcessLookupError:
                    pass  # already gone
                except Exception as e:
                    print(f"❌ Error stopping {name}: {e}")
    
    def monitor_processes(self):
        """Monitor both processes and handle their output."""
        print("\n📊 Monitoring services (Press Ctrl+C to stop)...")
        print("=" * 60)
        
        try:
            while True:
                # Check if processes are still running
                backend_running = self.backend_process and self.backend_process.poll() is None
                frontend_running = self.frontend_process and self.frontend_process.poll() is None
                
                if not backend_running and not frontend_running:
                    print("❌ Both services have stopped")
                    break
                elif not backend_running:
                    print("❌ Backend service has stopped")
                    break
                elif not frontend_running:
                    print("❌ Frontend service has stopped")
                    break
                
                # Read and display output from backend
                if backend_running and self.backend_process.stdout:
                    try:
                        line = self.backend_process.stdout.readline()
                        if line:
                            print(f"[BACKEND] {line.rstrip()}")
                    except:
                        pass
                
                # Read and display output from frontend
                if frontend_running and self.frontend_process.stdout:
                    try:
                        line = self.frontend_process.stdout.readline()
                        if line:
                            print(f"[FRONTEND] {line.rstrip()}")
                    except:
                        pass
                
                time.sleep(0.1)  # Small delay to prevent excessive CPU usage
                
        except KeyboardInterrupt:
            print("\n🛑 Interrupt received, shutting down...")
        finally:
            self.stop_all()
    
    def run(self):
        """Main entry point to start both services."""
        print("🌟 BizDaily Application Runner")
        print("=" * 40)
        
        
        # Start backend
        print("\n🔄 Step 1: Starting backend server...")
        if not self.start_backend():
            print("❌ Failed to start backend. Exiting.")
            return

        # Wait a moment for backend to initialize
        time.sleep(2)
        print("✅ Step 1 Complete: Backend server started")

        # Start frontend
        print("\n🔄 Step 2: Starting frontend server...")
        if not self.start_frontend():
            print("❌ Failed to start frontend. Stopping backend...")
            self.stop_all()
            return

        # Wait a moment for frontend to initialize
        time.sleep(3)
        print("✅ Step 2 Complete: Frontend server started")
        
        print("\n✅ Both services started successfully!")
        print(f"🌐 Backend running at: http://localhost:{BACKEND_PORT}")
        print(f"🎨 Frontend running at: http://localhost:{FRONTEND_PORT}")
        print("\n🔍 Application URLs:")
        print(f"   - Main App: http://localhost:{FRONTEND_PORT}")
        print(f"   - Daily Brief: http://localhost:{FRONTEND_PORT}/daily-brief")
        print(f"   - API Docs: http://localhost:{BACKEND_PORT}/docs")
        
        # Monitor processes
        self.monitor_processes()

def main():
    """Main function."""
    runner = BizDailyRunner()
    try:
        runner.run()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        runner.stop_all()
    finally:
        print("\n👋 Runner stopped. Have a great day!")

if __name__ == "__main__":
    main()
