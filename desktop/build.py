import os
import subprocess
import sys

def run_command(cmd):
    print(f"Running: {cmd}")
    subprocess.check_call(cmd, shell=True)

def main():
    desktop_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Install requirements
    req_file = os.path.join(desktop_dir, "requirements-desktop.txt")
    run_command(f"{sys.executable} -m pip install -r {req_file}")
    
    # Run PyInstaller
    spec_file = os.path.join(desktop_dir, "pvp.spec")
    os.chdir(desktop_dir)
    run_command(f"{sys.executable} -m PyInstaller --clean --noconfirm {spec_file}")
    
    print("Build completed successfully. Check the 'dist' directory for PVP-Player.exe")

if __name__ == "__main__":
    main()
