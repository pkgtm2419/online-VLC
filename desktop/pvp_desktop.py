import os
import sys
import threading
import time
import webbrowser
import socket
from PIL import Image, ImageDraw
import pystray
from pystray import MenuItem as item
import tkinter as tk
from tkinter import messagebox

# Adjust path so `app` can be imported
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS # When frozen, app is in MEIPASS

sys.path.insert(0, base_dir)

try:
    from app.main import app as fastapi_app
    import uvicorn
except Exception as e:
    root = tk.Tk()
    root.withdraw()
    messagebox.showerror("Error", f"Failed to import app: {e}")
    sys.exit(1)

def find_free_port(start_port=8000):
    port = start_port
    while port < 65535:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
        port += 1
    return 8000

server_thread = None
server = None
current_port = 8000

class StoppableUvicornServer(uvicorn.Server):
    def install_signal_handlers(self):
        # Disable signal handlers since we're running in a thread
        pass

def run_server(port):
    global server
    config = uvicorn.Config(fastapi_app, host="0.0.0.0", port=port, log_level="info")
    server = StoppableUvicornServer(config)
    server.run()

def start_server_thread(port):
    global server_thread
    server_thread = threading.Thread(target=run_server, args=(port,), daemon=True)
    server_thread.start()

def stop_server():
    global server
    if server:
        server.should_exit = True
        if server_thread:
            server_thread.join(timeout=3)
        server = None

def create_image():
    # Simple orange cone on dark background
    image = Image.new('RGB', (64, 64), color=(30, 30, 30))
    draw = ImageDraw.Draw(image)
    # Draw cone (orange triangle)
    draw.polygon([(32, 10), (10, 54), (54, 54)], fill=(255, 165, 0))
    # Draw a couple of white stripes
    draw.polygon([(26, 25), (38, 25), (42, 35), (22, 35)], fill=(255, 255, 255))
    return image

def on_open(icon, item):
    webbrowser.open(f"http://127.0.0.1:{current_port}")

def on_restart(icon, item):
    stop_server()
    time.sleep(1)
    start_server_thread(current_port)
    on_open(icon, item)

def on_quit(icon, item):
    icon.stop()
    stop_server()

def main():
    global current_port
    try:
        current_port = find_free_port(8000)
        start_server_thread(current_port)
        
        # Wait a moment for server to start
        time.sleep(1.5)
        on_open(None, None)
        
        icon_image = create_image()
        menu = pystray.Menu(
            item('Open in Browser', on_open, default=True),
            item('Restart Server', on_restart),
            item('Quit', on_quit)
        )
        icon = pystray.Icon("PVP", icon_image, "PVP Desktop", menu)
        icon.run()
    except Exception as e:
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("PVP Error", str(e))

if __name__ == '__main__':
    main()
