"""
Build script for PVP Mobile Android app.
Copies web assets and Python backend into the Android project structure.
"""

import shutil
import os
from pathlib import Path

# Paths
ROOT = Path(__file__).parent.parent  # d:\drive
MOBILE = ROOT / "mobile"
ANDROID = MOBILE / "android"
APP_SRC = ANDROID / "app" / "src" / "main"

# Destinations
ASSETS_WWW = APP_SRC / "assets" / "www"
PYTHON_SRC = APP_SRC / "python"


def copy_web_assets():
    """Copy the web frontend (HTML/CSS/JS) into Android assets."""
    src = ROOT / "app" / "static"
    dst = ASSETS_WWW
    
    # Clean and recreate
    if dst.exists():
        shutil.rmtree(dst)
    dst.mkdir(parents=True, exist_ok=True)
    
    for f in src.iterdir():
        if f.is_file():
            shutil.copy2(f, dst / f.name)
            print(f"  Copied: {f.name}")


def copy_python_backend():
    """Copy the Python backend into the Chaquopy source directory."""
    # Create app package in python source
    py_app = PYTHON_SRC / "app"
    py_app.mkdir(parents=True, exist_ok=True)
    
    # Copy Python files
    app_src = ROOT / "app"
    for f in ["__init__.py", "main.py", "extractor.py", "streamer.py"]:
        src_file = app_src / f
        if src_file.exists():
            shutil.copy2(src_file, py_app / f)
            print(f"  Copied: app/{f}")
        elif f == "__init__.py":
            # Create empty __init__.py if it doesn't exist
            (py_app / f).write_text("")
            print(f"  Created: app/{f}")
    
    # Copy static files into the python app/static too (for FastAPI to serve)
    py_static = py_app / "static"
    py_static.mkdir(parents=True, exist_ok=True)
    
    static_src = ROOT / "app" / "static"
    for f in static_src.iterdir():
        if f.is_file():
            shutil.copy2(f, py_static / f.name)
            print(f"  Copied: app/static/{f.name}")


def create_data_dir():
    """Ensure data directory exists for history.json."""
    data_dir = PYTHON_SRC / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    history = data_dir / "history.json"
    if not history.exists():
        history.write_text("[]")
        print("  Created: data/history.json")


def main():
    print("=" * 50)
    print("PVP Mobile - Android Build Setup")
    print("=" * 50)
    
    print("\n[1/3] Copying web assets...")
    copy_web_assets()
    
    print("\n[2/3] Copying Python backend...")
    copy_python_backend()
    
    print("\n[3/3] Setting up data directory...")
    create_data_dir()
    
    print("\n" + "=" * 50)
    print("Build setup complete!")
    print("\nNext steps:")
    print("  1. Open 'mobile/android/' in Android Studio")
    print("  2. Sync Gradle (Chaquopy will download Python)")
    print("  3. Build & Run on device/emulator")
    print("=" * 50)


if __name__ == "__main__":
    main()
