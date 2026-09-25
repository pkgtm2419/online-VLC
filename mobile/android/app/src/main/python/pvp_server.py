"""
PVP Server - Embedded FastAPI server for Android
Runs inside Chaquopy to provide the backend API.
"""

import threading
import os
import sys


def start_server(port=8000):
    """Start the FastAPI server on the given port."""
    # Set up paths for the Android environment
    os.environ.setdefault("PVP_PORT", str(port))
    
    # Import after path setup
    import uvicorn
    
    # We need to add the parent app directory to the path
    # so that 'from app.extractor import ...' works
    app_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(app_dir)
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)
    if app_dir not in sys.path:
        sys.path.insert(0, app_dir)
    
    try:
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=port,
            log_level="warning",
            access_log=False,
        )
    except Exception as e:
        print(f"Server error: {e}")


def stop_server():
    """Signal the server to stop."""
    # uvicorn handles SIGTERM, but on Android we may need to
    # force stop by raising SystemExit in the server thread
    os._exit(0)
