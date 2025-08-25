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
import subprocess
import time
from pathlib import Path

class BizDailyRunner:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.base_dir = Path(__file__).parent.absolute()
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def sync_funding_data(self):
        """Sync funding data before starting services."""
        backend_dir = self.base_dir / "backend"
        venv_python = backend_dir / "venv_new" / "bin" / "python"
        
        if not venv_python.exists():
            print(f"❌ Virtual environment not found at {venv_python}")
            return False
        
        try:
            print("📊 Syncing funding data...")
            print("   This may take a few minutes for the first run...")
            
            # Run the funding sync script
            result = subprocess.run(
                [str(venv_python), "-c", "from funding_service import bulk_save_funding_data; bulk_save_funding_data()"],
                cwd=str(backend_dir),
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode == 0:
                print("✅ Funding data sync completed successfully")
                if result.stdout:
                    print(f"   Output: {result.stdout.strip()}")
                return True
            else:
                print(f"❌ Funding data sync failed with exit code {result.returncode}")
                if result.stderr:
                    print(f"   Error: {result.stderr.strip()}")
                return False
                
        except subprocess.TimeoutExpired:
            print("⏰ Funding data sync timed out (5 minutes)")
            return False
        except Exception as e:
            print(f"❌ Error during funding data sync: {e}")
            return False
    
    def _signal_handler(self, signum, frame):
        """Handle interrupt signals and cleanup processes."""
        print(f"\n🛑 Received signal {signum}. Shutting down...")
        self.stop_all()
        sys.exit(0)
    
    def start_backend(self):
        """Start the backend server."""
        backend_dir = self.base_dir / "backend"
        venv_python = backend_dir / "venv_new" / "bin" / "python"
        
        if not venv_python.exists():
            print(f"❌ Virtual environment not found at {venv_python}")
            print("   Please create a virtual environment first:")
            print(f"   cd {backend_dir} && python -m venv venv_new")
            return False
        
        try:
            print(f"🚀 Starting backend server from {backend_dir}...")
            self.backend_process = subprocess.Popen(
                [str(venv_python), "run.py"],
                cwd=str(backend_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            return True
        except Exception as e:
            print(f"❌ Failed to start backend: {e}")
            return False
    
    def start_frontend(self):
        """Start the frontend development server."""
        frontend_dir = self.base_dir / "frontend"
        
        # Check if node_modules exists
        node_modules = frontend_dir / "node_modules"
        if not node_modules.exists():
            print(f"📦 Installing frontend dependencies...")
            try:
                subprocess.run(
                    ["npm", "install"],
                    cwd=str(frontend_dir),
                    check=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            except subprocess.CalledProcessError as e:
                print(f"❌ Failed to install frontend dependencies: {e}")
                return False
        
        try:
            print(f"🎨 Starting frontend server from {frontend_dir}...")
            self.frontend_process = subprocess.Popen(
                ["npm", "start"],
                cwd=str(frontend_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
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
                    process.terminate()
                    # Wait up to 5 seconds for graceful shutdown
                    try:
                        process.wait(timeout=5)
                        print(f"✅ {name} stopped gracefully")
                    except subprocess.TimeoutExpired:
                        print(f"⚠️  {name} didn't stop gracefully, forcing...")
                        process.kill()
                        process.wait()
                        print(f"✅ {name} force-stopped")
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
        
        # Sync funding data first
        print("🔄 Step 1: Syncing funding data...")
        if not self.sync_funding_data():
            print("⚠️  Funding data sync failed, but continuing with service startup...")
            print("   You can manually sync later if needed.")
        else:
            print("✅ Step 1 Complete: Funding data is up to date")
        
        # Start backend
        print("\n🔄 Step 2: Starting backend server...")
        if not self.start_backend():
            print("❌ Failed to start backend. Exiting.")
            return
        
        # Wait a moment for backend to initialize
        time.sleep(2)
        print("✅ Step 2 Complete: Backend server started")
        
        # Start frontend
        print("\n🔄 Step 3: Starting frontend server...")
        if not self.start_frontend():
            print("❌ Failed to start frontend. Stopping backend...")
            self.stop_all()
            return
        
        # Wait a moment for frontend to initialize
        time.sleep(3)
        print("✅ Step 3 Complete: Frontend server started")
        
        print("\n✅ Both services started successfully!")
        print("🌐 Backend running at: http://localhost:8000")
        print("🎨 Frontend running at: http://localhost:3000")
        print("\n🔍 Application URLs:")
        print("   - Main App: http://localhost:3000")
        print("   - Daily Brief: http://localhost:3000/daily-brief")
        print("   - API Docs: http://localhost:8000/docs")
        
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
