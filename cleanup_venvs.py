#!/usr/bin/env python3
"""
Cleanup script to remove unnecessary virtual environments and setup a clean development environment.

This script will:
1. Identify all virtual environment directories
2. Ask which one to keep (if any)
3. Remove the unnecessary ones
4. Provide instructions for setting up a clean environment
"""

import os
import shutil
import sys
from pathlib import Path

def find_venv_directories(base_path="."):
    """Find all potential virtual environment directories."""
    base = Path(base_path)
    venv_dirs = []
    
    # Common venv directory names
    venv_names = [
        "venv", "venv_new", "env", ".venv", "virtualenv",
        "#", "but", "optional", "recommended"
    ]
    
    for item in base.iterdir():
        if item.is_dir() and item.name in venv_names:
            # Check if it looks like a virtual environment
            if (item / "bin" / "activate").exists() or (item / "Scripts" / "activate").exists():
                venv_dirs.append(item)
    
    return venv_dirs

def get_venv_info(venv_path):
    """Get information about a virtual environment."""
    info = {"path": venv_path, "python_version": "Unknown", "packages": []}
    
    # Try to get Python version
    python_exe = None
    if (venv_path / "bin" / "python").exists():
        python_exe = venv_path / "bin" / "python"
    elif (venv_path / "Scripts" / "python.exe").exists():
        python_exe = venv_path / "Scripts" / "python.exe"
    
    if python_exe and python_exe.exists():
        try:
            import subprocess
            result = subprocess.run([str(python_exe), "--version"], 
                                 capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                info["python_version"] = result.stdout.strip()
        except:
            pass
    
    # Try to get installed packages
    pip_exe = None
    if (venv_path / "bin" / "pip").exists():
        pip_exe = venv_path / "bin" / "pip"
    elif (venv_path / "Scripts" / "pip.exe").exists():
        pip_exe = venv_path / "Scripts" / "pip.exe"
    
    if pip_exe and pip_exe.exists():
        try:
            import subprocess
            result = subprocess.run([str(pip_exe), "list", "--format=freeze"], 
                                 capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                packages = result.stdout.strip().split('\n')
                info["packages"] = [pkg for pkg in packages if pkg.strip()]
        except:
            pass
    
    return info

def display_venv_info(venv_infos):
    """Display information about found virtual environments."""
    print("\n📋 Found Virtual Environments:")
    print("=" * 70)
    
    for i, info in enumerate(venv_infos, 1):
        print(f"\n{i}. {info['path'].name}")
        print(f"   Path: {info['path']}")
        print(f"   Python: {info['python_version']}")
        print(f"   Packages: {len(info['packages'])} installed")
        
        # Show key packages
        key_packages = []
        for pkg in info['packages'][:5]:  # Show first 5 packages
            if '==' in pkg:
                key_packages.append(pkg.split('==')[0])
        if key_packages:
            print(f"   Key packages: {', '.join(key_packages)}")

def remove_directory_safely(path):
    """Safely remove a directory."""
    try:
        shutil.rmtree(path)
        print(f"✅ Removed: {path}")
        return True
    except Exception as e:
        print(f"❌ Failed to remove {path}: {e}")
        return False

def main():
    print("🧹 Virtual Environment Cleanup Tool")
    print("=" * 50)
    
    # Change to backend directory if it exists
    backend_path = Path("backend")
    if backend_path.exists():
        os.chdir(backend_path)
        print(f"📁 Working in: {Path.cwd()}")
    
    # Find virtual environments
    venv_dirs = find_venv_directories()
    
    if not venv_dirs:
        print("✅ No virtual environments found to clean up!")
        return
    
    # Get information about each venv
    venv_infos = []
    for venv_dir in venv_dirs:
        info = get_venv_info(venv_dir)
        venv_infos.append(info)
    
    # Display information
    display_venv_info(venv_infos)
    
    print(f"\n🤔 You have {len(venv_infos)} virtual environments.")
    print("It's recommended to keep only one for your project.")
    
    # Ask user what to do
    print("\nOptions:")
    print("0. Keep all (not recommended)")
    print("1-N. Keep only the selected environment (remove others)")
    print("99. Remove all virtual environments")
    
    while True:
        try:
            choice = input(f"\nEnter your choice (0-{len(venv_infos)} or 99): ").strip()
            
            if choice == "0":
                print("🤷 Keeping all virtual environments.")
                break
            elif choice == "99":
                print("\n⚠️  This will remove ALL virtual environments!")
                confirm = input("Are you sure? (yes/no): ").lower()
                if confirm in ['yes', 'y']:
                    removed_count = 0
                    for info in venv_infos:
                        if remove_directory_safely(info['path']):
                            removed_count += 1
                    print(f"\n🎉 Removed {removed_count} virtual environments!")
                else:
                    print("❌ Cancelled.")
                break
            else:
                choice_idx = int(choice) - 1
                if 0 <= choice_idx < len(venv_infos):
                    keep_venv = venv_infos[choice_idx]
                    print(f"\n✅ Keeping: {keep_venv['path'].name}")
                    
                    removed_count = 0
                    for i, info in enumerate(venv_infos):
                        if i != choice_idx:
                            if remove_directory_safely(info['path']):
                                removed_count += 1
                    
                    print(f"\n🎉 Removed {removed_count} unnecessary virtual environments!")
                    print(f"💡 Your active environment: {keep_venv['path'].name}")
                    break
                else:
                    print("❌ Invalid choice. Please try again.")
        except ValueError:
            print("❌ Invalid input. Please enter a number.")
        except KeyboardInterrupt:
            print("\n❌ Cancelled by user.")
            sys.exit(0)
    
    # Provide setup instructions
    print("\n" + "=" * 50)
    print("📋 SETUP INSTRUCTIONS")
    print("=" * 50)
    print("\n🔄 To set up a clean development environment:")
    print("1. Create a new virtual environment:")
    print("   python -m venv venv")
    print("\n2. Activate it:")
    print("   # On macOS/Linux:")
    print("   source venv/bin/activate")
    print("   # On Windows:")
    print("   venv\\Scripts\\activate")
    print("\n3. Install dependencies:")
    print("   pip install -r requirements.txt")
    print("\n4. Your .gitignore file has been created to ignore venv directories.")
    print("\n✨ Done! You now have a clean development environment.")

if __name__ == "__main__":
    main()
