"""
PVP Media Player - Native Windows Desktop Online Streamer
Powered by VideoLAN LibVLC Engine, yt-dlp, and PyQt6.
100% Local, Zero Local Web Server, Hardware Accelerated, Self-Contained.
"""

import os
import sys
import time
import json
import sqlite3
import urllib.parse
from pathlib import Path
from typing import Optional, Dict, Any, List

# Locate bundled LibVLC and FFmpeg
base_dir = os.path.dirname(os.path.abspath(__file__))
if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS

# 1. Setup LibVLC environment paths before importing vlc
libvlc_dir = os.path.join(base_dir, 'libvlc')
dll_candidates = [
    os.path.join(libvlc_dir, 'libvlc.dll'),
    os.path.join(base_dir, 'libvlc.dll'),
]
for c in dll_candidates:
    if os.path.exists(c):
        os.environ['PYTHON_VLC_LIB_PATH'] = c
        if hasattr(os, 'add_dll_directory'):
            try:
                os.add_dll_directory(os.path.dirname(c))
            except Exception:
                pass
        break

plugin_candidates = [
    os.path.join(libvlc_dir, 'plugins'),
    os.path.join(base_dir, 'plugins'),
]
for p in plugin_candidates:
    if os.path.exists(p):
        os.environ['VLC_PLUGIN_PATH'] = p
        break

# 2. Add bundled bin (ffmpeg) to PATH
bin_dir = os.path.join(base_dir, 'bin')
if os.path.exists(bin_dir):
    os.environ['PATH'] = bin_dir + os.pathsep + os.environ.get('PATH', '')
    if hasattr(os, 'add_dll_directory'):
        try:
            os.add_dll_directory(bin_dir)
        except Exception:
            pass

# Import VLC and PyQt6
try:
    import vlc
except Exception as e:
    raise RuntimeError(f"Failed to load LibVLC: {e}")

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLineEdit, QPushButton, QLabel, QSlider, QFrame, QStackedWidget,
    QMenuBar, QMenu, QFileDialog, QMessageBox, QTabWidget, QListWidget,
    QListWidgetItem, QSplitter, QSizePolicy, QToolTip, QDialog
)
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal, QSize, QPoint
from PyQt6.QtGui import (
    QIcon, QPixmap, QAction, QKeySequence, QFont, QColor, QPalette,
    QMouseEvent, QWheelEvent, QCursor
)

# Add base_dir to sys.path so app modules can be imported directly
sys.path.insert(0, base_dir)
from app.extractor import extract_video_info

# Initialize Data Directory & Database
data_dir = os.path.join(base_dir, 'data')
os.makedirs(data_dir, exist_ok=True)
DB_PATH = os.path.join(data_dir, 'playlists.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE,
            title TEXT,
            uploader TEXT,
            duration_str TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS playlists (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS playlist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            playlist_id TEXT NOT NULL,
            url TEXT NOT NULL,
            title TEXT,
            duration_str TEXT,
            position INTEGER DEFAULT 0,
            FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def format_time(ms: int) -> str:
    """Format milliseconds into MM:SS or HH:MM:SS."""
    if ms < 0:
        return "--:--"
    total_seconds = ms // 1000
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    return f"{minutes:02d}:{seconds:02d}"


# =============================================================================
# Stream Extractor Worker Thread (Non-blocking)
# =============================================================================
class ExtractorWorker(QThread):
    finished = pyqtSignal(dict, str, str)  # info, video_url, audio_url
    error = pyqtSignal(str)

    def __init__(self, raw_url: str):
        super().__init__()
        self.raw_url = raw_url.strip()

    def run(self):
        try:
            info = extract_video_info(self.raw_url)
            if not info or not info.get("success", True):
                err = info.get("error", "Failed to retrieve stream formats.") if info else "No video data."
                self.error.emit(err)
                return

            # Determine best playable URL
            video_url = None
            audio_url = None

            qualities = info.get("qualities", [])
            if qualities:
                # 1. Prefer direct or progressive formats
                for q in qualities:
                    if q.get("type") in ("direct", "progressive") and q.get("video_url"):
                        video_url = q["video_url"]
                        audio_url = q.get("audio_url")
                        break
                
                # 2. Fallback to any valid video format
                if not video_url:
                    first = qualities[0]
                    video_url = first.get("video_url")
                    audio_url = first.get("audio_url")

            # 3. Check embedded sources if present
            if not video_url and info.get("embedded_sources"):
                for es in info["embedded_sources"]:
                    if es.get("url"):
                        video_url = es["url"]
                        break

            # 4. Fallback to direct webpage URL
            if not video_url:
                video_url = info.get("webpage_url") or self.raw_url

            self.finished.emit(info, video_url, audio_url or "")
        except Exception as e:
            self.error.emit(str(e))


# =============================================================================
# Custom Clickable Video Surface Frame
# =============================================================================
class VideoSurface(QFrame):
    doubleClicked = pyqtSignal()
    singleClicked = pyqtSignal()
    wheelScrolled = pyqtSignal(int)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("background-color: #000000;")
        self.setMouseTracking(True)
        self._click_timer = QTimer(self)
        self._click_timer.setSingleShot(True)
        self._click_timer.timeout.connect(self._emit_single_click)

    def mouseDoubleClickEvent(self, event: QMouseEvent):
        self._click_timer.stop()
        if event.button() == Qt.MouseButton.LeftButton:
            self.doubleClicked.emit()

    def mousePressEvent(self, event: QMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self._click_timer.start(220)

    def _emit_single_click(self):
        self.singleClicked.emit()

    def wheelEvent(self, event: QWheelEvent):
        delta = event.angleDelta().y()
        self.wheelScrolled.emit(delta)


# =============================================================================
# Main Player Window
# =============================================================================
class PVPPlayerWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("PVP Media Player - Online VLC")
        self.setMinimumSize(960, 600)
        self.resize(1150, 720)

        # Assets
        self.logo_path = os.path.join(base_dir, 'app', 'static', 'logo.png')
        self.logo_ico = os.path.join(base_dir, 'app', 'static', 'logo.ico')
        if os.path.exists(self.logo_ico):
            self.setWindowIcon(QIcon(self.logo_ico))
        elif os.path.exists(self.logo_path):
            self.setWindowIcon(QIcon(self.logo_path))

        # State Variables
        self.current_url = ""
        self.current_title = "PVP Media Player"
        self.is_seeking = False
        self.worker: Optional[ExtractorWorker] = None
        self.last_clipboard_url = ""
        self.current_speed = 1.0

        # Initialize LibVLC Instance & Media Player
        vlc_args = [
            '--no-video-title-show',
            '--no-sub-autodetect-file',
            '--avcodec-hw=any',
            '--network-caching=2500',
            '--file-caching=2500',
            '--live-caching=2500',
            '--quiet'
        ]
        self.vlc_instance = vlc.Instance(vlc_args)
        self.player = self.vlc_instance.media_player_new()

        # Build UI
        self.apply_theme()
        self.init_ui()
        self.init_menu()
        self.init_shortcuts()

        # Connect Video Frame to LibVLC (HWND handle)
        video_hwnd = int(self.video_surface.winId())
        self.player.set_hwnd(video_hwnd)

        # Playback Progress Polling Timer (every 250ms)
        self.progress_timer = QTimer(self)
        self.progress_timer.setInterval(250)
        self.progress_timer.timeout.connect(self.update_playback_ui)
        self.progress_timer.start()

        # Clipboard Auto-Detection
        QApplication.clipboard().dataChanged.connect(self.on_clipboard_changed)

    def apply_theme(self):
        """Authentic VLC Dark Theme with Vibrant Orange Accents."""
        self.setStyleSheet("""
            QMainWindow {
                background-color: #121316;
            }
            QWidget {
                color: #e2e4e8;
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                font-size: 13px;
            }
            QMenuBar {
                background-color: #1c1e22;
                color: #d1d5db;
                border-bottom: 1px solid #2d3036;
                padding: 2px 6px;
            }
            QMenuBar::item {
                background-color: transparent;
                padding: 4px 10px;
                border-radius: 4px;
            }
            QMenuBar::item:selected {
                background-color: #2c2f35;
                color: #ffffff;
            }
            QMenu {
                background-color: #1c1e22;
                color: #e2e4e8;
                border: 1px solid #32363d;
                border-radius: 6px;
                padding: 4px;
            }
            QMenu::item {
                padding: 6px 24px 6px 12px;
                border-radius: 4px;
            }
            QMenu::item:selected {
                background-color: #ff7700;
                color: #ffffff;
            }
            QMenu::separator {
                height: 1px;
                background-color: #2d3036;
                margin: 4px 8px;
            }
            QLineEdit {
                background-color: #1c1e22;
                border: 1px solid #33373f;
                border-radius: 6px;
                padding: 8px 12px;
                color: #ffffff;
                font-size: 13px;
                selection-background-color: #ff7700;
            }
            QLineEdit:focus {
                border: 1px solid #ff7700;
                background-color: #22252a;
            }
            QPushButton {
                background-color: #262930;
                border: 1px solid #363b45;
                border-radius: 6px;
                color: #e2e4e8;
                padding: 8px 14px;
                font-weight: 500;
            }
            QPushButton:hover {
                background-color: #31353e;
                border-color: #4a505c;
                color: #ffffff;
            }
            QPushButton:pressed {
                background-color: #1e2025;
            }
            QPushButton.btn-orange {
                background-color: #ff7700;
                border: 1px solid #e66b00;
                color: #ffffff;
                font-weight: 600;
            }
            QPushButton.btn-orange:hover {
                background-color: #ff8800;
                border-color: #ff9922;
            }
            QPushButton.btn-orange:pressed {
                background-color: #cc5f00;
            }
            QSlider::groove:horizontal {
                height: 5px;
                background: #2a2e36;
                border-radius: 2px;
            }
            QSlider::sub-page:horizontal {
                background: #ff7700;
                border-radius: 2px;
            }
            QSlider::handle:horizontal {
                background: #ffffff;
                border: 2px solid #ff7700;
                width: 14px;
                height: 14px;
                margin: -5px 0;
                border-radius: 7px;
            }
            QSlider::handle:horizontal:hover {
                background: #ffaa44;
                width: 16px;
                height: 16px;
                margin: -6px 0;
                border-radius: 8px;
            }
            QTabWidget::pane {
                border: 1px solid #282c34;
                background-color: #181a1e;
            }
            QTabBar::tab {
                background-color: #1c1e22;
                color: #9ca3af;
                padding: 8px 16px;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                margin-right: 2px;
            }
            QTabBar::tab:selected {
                background-color: #262930;
                color: #ff7700;
                font-weight: 600;
            }
            QListWidget {
                background-color: #16181b;
                border: none;
                color: #e2e4e8;
            }
            QListWidget::item {
                padding: 8px 12px;
                border-bottom: 1px solid #202328;
                border-radius: 4px;
            }
            QListWidget::item:hover {
                background-color: #21242a;
            }
            QListWidget::item:selected {
                background-color: #ff7700;
                color: #ffffff;
            }
        """)

    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # -------------------------------------------------------------
        # 1. Top Streaming Control Bar
        # -------------------------------------------------------------
        top_bar = QFrame()
        top_bar.setStyleSheet("background-color: #181a1e; border-bottom: 1px solid #282c34;")
        top_layout = QHBoxLayout(top_bar)
        top_layout.setContentsMargins(12, 10, 12, 10)
        top_layout.setSpacing(8)

        # Brand Logo + Name
        if os.path.exists(self.logo_path):
            logo_lbl = QLabel()
            pix = QPixmap(self.logo_path).scaled(28, 28, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
            logo_lbl.setPixmap(pix)
            top_layout.addWidget(logo_lbl)

        brand_lbl = QLabel("PVP")
        brand_lbl.setStyleSheet("font-weight: 800; font-size: 15px; color: #ff7700; letter-spacing: 0.5px;")
        top_layout.addWidget(brand_lbl)

        # Stream URL Input
        self.url_input = QLineEdit()
        self.url_input.setPlaceholderText("Enter or paste any video URL (YouTube, Vimeo, HLS .m3u8, Direct MP4, Movies, Mega)...")
        self.url_input.returnPressed.connect(self.on_stream_clicked)
        top_layout.addWidget(self.url_input)

        # One-Tap Paste & Play
        self.btn_paste_play = QPushButton("📋 Paste & Play")
        self.btn_paste_play.setProperty("class", "btn-orange")
        self.btn_paste_play.setStyleSheet("background-color: #ff7700; color: #fff; font-weight: bold;")
        self.btn_paste_play.setToolTip("Paste URL from Windows clipboard and start streaming immediately")
        self.btn_paste_play.clicked.connect(self.on_paste_and_play)
        top_layout.addWidget(self.btn_paste_play)

        # Stream Button
        self.btn_stream = QPushButton("▶ Stream")
        self.btn_stream.clicked.connect(self.on_stream_clicked)
        top_layout.addWidget(self.btn_stream)

        # Clear Input
        btn_clear = QPushButton("✕")
        btn_clear.setFixedWidth(32)
        btn_clear.setToolTip("Clear URL field")
        btn_clear.clicked.connect(self.url_input.clear)
        top_layout.addWidget(btn_clear)

        # Playlist Drawer Toggle
        self.btn_toggle_drawer = QPushButton("☰ Playlist")
        self.btn_toggle_drawer.setCheckable(True)
        self.btn_toggle_drawer.clicked.connect(self.toggle_drawer)
        top_layout.addWidget(self.btn_toggle_drawer)

        main_layout.addWidget(top_bar)

        # -------------------------------------------------------------
        # 1.5 Clipboard Detection Notification Banner
        # -------------------------------------------------------------
        self.clip_banner = QFrame()
        self.clip_banner.setStyleSheet("background-color: #2b1f14; border-bottom: 1px solid #ff7700; padding: 6px;")
        clip_layout = QHBoxLayout(self.clip_banner)
        clip_layout.setContentsMargins(16, 4, 16, 4)
        clip_layout.setSpacing(10)

        self.clip_label = QLabel("📋 Found video URL in clipboard: ")
        self.clip_label.setStyleSheet("color: #ffb366; font-size: 12px; font-weight: 500;")
        clip_layout.addWidget(self.clip_label)

        clip_play_btn = QPushButton("▶ Stream Now")
        clip_play_btn.setStyleSheet("background-color: #ff7700; color: #fff; font-size: 11px; padding: 3px 10px;")
        clip_play_btn.clicked.connect(self.play_clipboard_url)
        clip_layout.addWidget(clip_play_btn)

        clip_dismiss_btn = QPushButton("✕")
        clip_dismiss_btn.setStyleSheet("background-color: transparent; border: none; color: #ffb366; font-size: 13px;")
        clip_dismiss_btn.clicked.connect(lambda: self.clip_banner.hide())
        clip_layout.addWidget(clip_dismiss_btn)

        self.clip_banner.hide()
        main_layout.addWidget(self.clip_banner)

        # -------------------------------------------------------------
        # 2. Central Splitter (Video Screen + Side Drawer)
        # -------------------------------------------------------------
        self.splitter = QSplitter(Qt.Orientation.Horizontal)
        self.splitter.setStyleSheet("QSplitter::handle { background-color: #24272d; width: 2px; }")

        # Central Stacked Display
        self.display_stack = QStackedWidget()

        # Page 0: Idle Poster Screen
        self.idle_screen = self.create_idle_screen()
        self.display_stack.addWidget(self.idle_screen)

        # Page 1: Video Output Surface
        self.video_surface = VideoSurface()
        self.video_surface.singleClicked.connect(self.toggle_play_pause)
        self.video_surface.doubleClicked.connect(self.toggle_fullscreen)
        self.video_surface.wheelScrolled.connect(self.handle_wheel_volume)
        self.display_stack.addWidget(self.video_surface)

        # Page 2: Loading / Resolving Screen
        self.loading_screen = self.create_loading_screen()
        self.display_stack.addWidget(self.loading_screen)

        self.display_stack.setCurrentIndex(0)
        self.splitter.addWidget(self.display_stack)

        # Right Side Drawer (History & Playlists)
        self.drawer_widget = self.create_drawer_widget()
        self.drawer_widget.hide()
        self.splitter.addWidget(self.drawer_widget)

        self.splitter.setStretchFactor(0, 1)
        self.splitter.setStretchFactor(1, 0)
        main_layout.addWidget(self.splitter, 1)

        # -------------------------------------------------------------
        # 3. Bottom Playback Controls Bar
        # -------------------------------------------------------------
        bottom_bar = QFrame()
        bottom_bar.setStyleSheet("background-color: #181a1e; border-top: 1px solid #282c34;")
        bottom_layout = QVBoxLayout(bottom_bar)
        bottom_layout.setContentsMargins(12, 6, 12, 8)
        bottom_layout.setSpacing(6)

        # Row 1: Seek Slider + Time Display
        seek_layout = QHBoxLayout()
        seek_layout.setSpacing(10)

        self.time_current = QLabel("00:00")
        self.time_current.setStyleSheet("font-family: monospace; font-size: 12px; color: #a0a6b1;")
        seek_layout.addWidget(self.time_current)

        self.seek_slider = QSlider(Qt.Orientation.Horizontal)
        self.seek_slider.setRange(0, 1000)
        self.seek_slider.sliderMoved.connect(self.on_seek_moved)
        self.seek_slider.sliderPressed.connect(self.on_seek_pressed)
        self.seek_slider.sliderReleased.connect(self.on_seek_released)
        seek_layout.addWidget(self.seek_slider)

        self.time_total = QLabel("00:00")
        self.time_total.setStyleSheet("font-family: monospace; font-size: 12px; color: #a0a6b1;")
        seek_layout.addWidget(self.time_total)

        bottom_layout.addLayout(seek_layout)

        # Row 2: Control Buttons Row
        ctrl_layout = QHBoxLayout()
        ctrl_layout.setSpacing(8)

        # Play / Pause
        self.btn_play = QPushButton("▶")
        self.btn_play.setFixedWidth(44)
        self.btn_play.setStyleSheet("font-size: 16px; font-weight: bold; background-color: #ff7700; color: #fff;")
        self.btn_play.clicked.connect(self.toggle_play_pause)
        ctrl_layout.addWidget(self.btn_play)

        # Stop
        self.btn_stop = QPushButton("⏹")
        self.btn_stop.setFixedWidth(36)
        self.btn_stop.clicked.connect(self.stop_playback)
        ctrl_layout.addWidget(self.btn_stop)

        # Skip Back 10s
        btn_back = QPushButton("⏪ 10s")
        btn_back.clicked.connect(lambda: self.seek_relative(-10000))
        ctrl_layout.addWidget(btn_back)

        # Skip Forward 10s
        btn_fwd = QPushButton("⏩ 10s")
        btn_fwd.clicked.connect(lambda: self.seek_relative(10000))
        ctrl_layout.addWidget(btn_fwd)

        # Stream Info Title Label
        self.lbl_status = QLabel("Ready • Direct VLC Engine")
        self.lbl_status.setStyleSheet("color: #8b929e; font-size: 12px;")
        self.lbl_status.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Preferred)
        ctrl_layout.addWidget(self.lbl_status)

        # Playback Speed Button
        self.btn_speed = QPushButton("1.0x")
        self.btn_speed.setToolTip("Playback Speed")
        self.btn_speed.clicked.connect(self.cycle_speed)
        ctrl_layout.addWidget(self.btn_speed)

        # Audio Track Button
        self.btn_audio = QPushButton("🔊 Audio")
        self.btn_audio.clicked.connect(self.show_audio_tracks_menu)
        ctrl_layout.addWidget(self.btn_audio)

        # Subtitles Button
        self.btn_sub = QPushButton("💬 Subs")
        self.btn_sub.clicked.connect(self.show_subtitle_menu)
        ctrl_layout.addWidget(self.btn_sub)

        # Volume Slider
        self.lbl_vol_icon = QLabel("🔊")
        ctrl_layout.addWidget(self.lbl_vol_icon)

        self.vol_slider = QSlider(Qt.Orientation.Horizontal)
        self.vol_slider.setRange(0, 125)
        self.vol_slider.setValue(100)
        self.vol_slider.setFixedWidth(80)
        self.vol_slider.valueChanged.connect(self.on_volume_changed)
        ctrl_layout.addWidget(self.vol_slider)

        self.lbl_vol_val = QLabel("100%")
        self.lbl_vol_val.setFixedWidth(36)
        self.lbl_vol_val.setStyleSheet("font-size: 11px; color: #a0a6b1;")
        ctrl_layout.addWidget(self.lbl_vol_val)

        # Fullscreen
        btn_fs = QPushButton("⛶")
        btn_fs.setFixedWidth(36)
        btn_fs.setToolTip("Fullscreen (F11)")
        btn_fs.clicked.connect(self.toggle_fullscreen)
        ctrl_layout.addWidget(btn_fs)

        bottom_layout.addLayout(ctrl_layout)
        main_layout.addWidget(bottom_bar)

    def create_idle_screen(self) -> QWidget:
        """Create the central idle screen when no video is playing."""
        widget = QWidget()
        widget.setStyleSheet("background: qradialgradient(cx:0.5, cy:0.5, radius: 0.8, fx:0.5, fy:0.5, stop:0 #1a1c21, stop:1 #0c0d0f);")
        layout = QVBoxLayout(widget)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(16)

        # Central 3D VLC Cone Poster
        if os.path.exists(self.logo_path):
            poster_lbl = QLabel()
            pix = QPixmap(self.logo_path).scaled(140, 140, Qt.AspectRatioMode.KeepAspectRatio, Qt.TransformationMode.SmoothTransformation)
            poster_lbl.setPixmap(pix)
            poster_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
            layout.addWidget(poster_lbl)

        # App Title & Tagline
        title_lbl = QLabel("PVP media player")
        title_lbl.setStyleSheet("font-size: 24px; font-weight: 700; color: #e6e8eb;")
        title_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title_lbl)

        tagline = QLabel("⚡ Direct Universal Online Streamer • 100% Ad-Free • Powered by LibVLC")
        tagline.setStyleSheet("font-size: 13px; color: #8e95a2;")
        tagline.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(tagline)

        # Center Actions Row
        actions_layout = QHBoxLayout()
        actions_layout.setSpacing(12)
        actions_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        btn_center_paste = QPushButton("📋 Paste & Play (One-Tap)")
        btn_center_paste.setStyleSheet("background-color: #ff7700; color: #ffffff; font-weight: bold; font-size: 14px; padding: 10px 20px; border-radius: 8px;")
        btn_center_paste.clicked.connect(self.on_paste_and_play)
        actions_layout.addWidget(btn_center_paste)

        btn_center_stream = QPushButton("🌐 Open Network Stream (Ctrl+N)")
        btn_center_stream.setStyleSheet("background-color: #272b33; font-size: 13px; padding: 10px 18px; border-radius: 8px;")
        btn_center_stream.clicked.connect(lambda: self.url_input.setFocus())
        actions_layout.addWidget(btn_center_stream)

        layout.addLayout(actions_layout)

        # Supported Services Badges
        pills_layout = QHBoxLayout()
        pills_layout.setSpacing(8)
        pills_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        for name in ["YouTube", "Vimeo", "Direct MP4/HLS", "Mega.nz", "Movies (DooPlay)", "Telegram"]:
            pill = QLabel(name)
            pill.setStyleSheet("background-color: #1f2229; color: #9aa1ad; font-size: 11px; padding: 4px 10px; border-radius: 12px; border: 1px solid #2d313a;")
            pills_layout.addWidget(pill)
        layout.addLayout(pills_layout)

        return widget

    def create_loading_screen(self) -> QWidget:
        """Create the resolving / loading state screen."""
        widget = QWidget()
        widget.setStyleSheet("background-color: #0c0d0f;")
        layout = QVBoxLayout(widget)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.setSpacing(12)

        self.loading_title = QLabel("⚡ Resolving video stream...")
        self.loading_title.setStyleSheet("font-size: 18px; font-weight: 600; color: #ff7700;")
        self.loading_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.loading_title)

        self.loading_sub = QLabel("Filtering tracking scripts & ad networks directly in-process...")
        self.loading_sub.setStyleSheet("font-size: 12px; color: #8e95a2;")
        self.loading_sub.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.loading_sub)

        btn_cancel = QPushButton("Cancel")
        btn_cancel.setFixedWidth(100)
        btn_cancel.clicked.connect(self.stop_playback)
        layout.addWidget(btn_cancel, alignment=Qt.AlignmentFlag.AlignCenter)

        return widget

    def create_drawer_widget(self) -> QWidget:
        """Create the sliding side drawer for History & Playlists."""
        drawer = QWidget()
        drawer.setMinimumWidth(280)
        drawer.setMaximumWidth(380)
        drawer.setStyleSheet("background-color: #16181c; border-left: 1px solid #262930;")
        layout = QVBoxLayout(drawer)
        layout.setContentsMargins(8, 8, 8, 8)

        tabs = QTabWidget()

        # History Tab
        self.history_list = QListWidget()
        self.history_list.itemDoubleClicked.connect(self.on_history_item_clicked)
        tabs.addTab(self.history_list, "Recent History")

        # Playlists Tab
        self.playlist_list = QListWidget()
        self.playlist_list.itemDoubleClicked.connect(self.on_playlist_item_clicked)
        tabs.addTab(self.playlist_list, "Playlists")

        layout.addWidget(tabs)
        self.refresh_history()
        return drawer

    def init_menu(self):
        menubar = self.menuBar()

        # Media Menu
        media_menu = menubar.addMenu("Media")
        act_open_stream = media_menu.addAction("Open Network Stream...")
        act_open_stream.setShortcut("Ctrl+N")
        act_open_stream.triggered.connect(lambda: self.url_input.setFocus())

        act_paste_play = media_menu.addAction("Paste & Play")
        act_paste_play.setShortcut("Ctrl+V")
        act_paste_play.triggered.connect(self.on_paste_and_play)

        act_playlist = media_menu.addAction("Open Playlist Drawer")
        act_playlist.setShortcut("Ctrl+L")
        act_playlist.triggered.connect(self.toggle_drawer)

        media_menu.addSeparator()
        act_stop = media_menu.addAction("Stop")
        act_stop.setShortcut("S")
        act_stop.triggered.connect(self.stop_playback)

        media_menu.addSeparator()
        act_quit = media_menu.addAction("Quit")
        act_quit.setShortcut("Ctrl+Q")
        act_quit.triggered.connect(self.close)

        # Playback Menu
        pb_menu = menubar.addMenu("Playback")
        act_pp = pb_menu.addAction("Play / Pause")
        act_pp.setShortcut("Space")
        act_pp.triggered.connect(self.toggle_play_pause)

        act_faster = pb_menu.addAction("Faster")
        act_faster.setShortcut("]")
        act_faster.triggered.connect(lambda: self.adjust_speed(0.25))

        act_slower = pb_menu.addAction("Slower")
        act_slower.setShortcut("[")
        act_slower.triggered.connect(lambda: self.adjust_speed(-0.25))

        act_normal = pb_menu.addAction("Normal Rate")
        act_normal.setShortcut("=")
        act_normal.triggered.connect(lambda: self.set_speed(1.0))

        # Audio Menu
        audio_menu = menubar.addMenu("Audio")
        act_mute = audio_menu.addAction("Mute")
        act_mute.setShortcut("M")
        act_mute.triggered.connect(self.toggle_mute)

        act_vol_up = audio_menu.addAction("Volume Up")
        act_vol_up.setShortcut("Ctrl+Up")
        act_vol_up.triggered.connect(lambda: self.adjust_volume(5))

        act_vol_down = audio_menu.addAction("Volume Down")
        act_vol_down.setShortcut("Ctrl+Down")
        act_vol_down.triggered.connect(lambda: self.adjust_volume(-5))

        # Video Menu
        video_menu = menubar.addMenu("Video")
        act_fs = video_menu.addAction("Fullscreen")
        act_fs.setShortcut("F11")
        act_fs.triggered.connect(self.toggle_fullscreen)

        aspect_menu = video_menu.addMenu("Aspect Ratio")
        for ratio in ["Default", "16:9", "4:3", "21:9", "1:1"]:
            a = aspect_menu.addAction(ratio)
            a.triggered.connect(lambda checked, r=ratio: self.set_aspect_ratio(r))

        # Subtitle Menu
        sub_menu = menubar.addMenu("Subtitle")
        act_add_sub = sub_menu.addAction("Add Subtitle File...")
        act_add_sub.triggered.connect(self.add_subtitle_file)

        # Tools & Help
        tools_menu = menubar.addMenu("Tools")
        act_info = tools_menu.addAction("Stream Media Info")
        act_info.setShortcut("Ctrl+I")
        act_info.triggered.connect(self.show_stream_info)

        help_menu = menubar.addMenu("Help")
        act_about = help_menu.addAction("About PVP Player")
        act_about.triggered.connect(self.show_about)

    def init_shortcuts(self):
        """Register keyboard navigation shortcuts."""
        pass

    # -------------------------------------------------------------
    # Stream Playback & In-Process Extraction
    # -------------------------------------------------------------
    def on_paste_and_play(self):
        """Read clipboard and trigger instant streaming."""
        clipboard = QApplication.clipboard()
        text = clipboard.text().strip()
        if text and (text.startswith("http://") or text.startswith("https://") or text.startswith("t.me/") or text.startswith("magnet:")):
            self.url_input.setText(text)
            self.start_stream(text)
        else:
            self.lbl_status.setText("Clipboard does not contain a valid URL.")

    def on_stream_clicked(self):
        url = self.url_input.text().strip()
        if url:
            self.start_stream(url)

    def start_stream(self, url: str):
        """Launch background extractor worker to resolve stream."""
        self.stop_playback(clear_url=False)
        self.current_url = url
        self.display_stack.setCurrentIndex(2)  # Loading screen
        self.loading_title.setText(f"⚡ Resolving: {url[:60]}...")
        self.lbl_status.setText(f"Extracting stream MRL from {url[:50]}...")

        self.worker = ExtractorWorker(url)
        self.worker.finished.connect(self.on_extractor_finished)
        self.worker.error.connect(self.on_extractor_error)
        self.worker.start()

    def on_extractor_finished(self, info: dict, video_url: str, audio_url: str):
        self.current_title = info.get("title") or "Online Stream"
        self.setWindowTitle(f"{self.current_title} - PVP Media Player")
        self.lbl_status.setText(f"▶ Playing: {self.current_title}")

        # Create LibVLC Media with Direct URL & Optional Audio Slave
        media_options = []
        if audio_url and audio_url != video_url:
            media_options.append(f":input-slave={audio_url}")

        media = self.vlc_instance.media_new(video_url, *media_options)
        self.player.set_media(media)
        self.player.play()

        # Switch to Video Output Surface
        self.display_stack.setCurrentIndex(1)
        self.btn_play.setText("⏸")

        # Save to SQLite history
        self.save_to_history(self.current_url, self.current_title, info.get("uploader", ""), info.get("duration_str", ""))

    def on_extractor_error(self, err_msg: str):
        self.display_stack.setCurrentIndex(0)
        self.lbl_status.setText(f"❌ Error: {err_msg}")
        QMessageBox.warning(self, "Stream Error", f"Unable to resolve stream:\n\n{err_msg}")

    # -------------------------------------------------------------
    # Playback Controls
    # -------------------------------------------------------------
    def toggle_play_pause(self):
        if self.player.is_playing():
            self.player.pause()
            self.btn_play.setText("▶")
            self.lbl_status.setText("⏸ Paused")
        else:
            self.player.play()
            self.btn_play.setText("⏸")
            self.lbl_status.setText("▶ Playing")

    def stop_playback(self, clear_url: bool = True):
        self.player.stop()
        self.btn_play.setText("▶")
        self.time_current.setText("00:00")
        self.seek_slider.setValue(0)
        if clear_url:
            self.display_stack.setCurrentIndex(0)
            self.lbl_status.setText("Stopped • Ready")
            self.setWindowTitle("PVP Media Player - Online VLC")

    def seek_relative(self, delta_ms: int):
        cur = self.player.get_time()
        if cur >= 0:
            target = max(0, cur + delta_ms)
            self.player.set_time(target)

    def on_seek_pressed(self):
        self.is_seeking = True

    def on_seek_released(self):
        pos = self.seek_slider.value() / 1000.0
        self.player.set_position(pos)
        self.is_seeking = False

    def on_seek_moved(self, value: int):
        length = self.player.get_length()
        if length > 0:
            cur_ms = int(length * (value / 1000.0))
            self.time_current.setText(format_time(cur_ms))

    def update_playback_ui(self):
        """Update timeline, duration, and state indicators periodically."""
        if not self.player:
            return

        state = self.player.get_state()
        if state == vlc.State.Ended:
            self.stop_playback()
            return

        if not self.is_seeking:
            cur_time = self.player.get_time()
            total_time = self.player.get_length()
            if total_time > 0 and cur_time >= 0:
                pos = int((cur_time / total_time) * 1000)
                self.seek_slider.setValue(pos)
                self.time_current.setText(format_time(cur_time))
                self.time_total.setText(format_time(total_time))
            elif cur_time >= 0:
                # Live stream
                self.time_current.setText(format_time(cur_time))
                self.time_total.setText("LIVE")

    def on_volume_changed(self, value: int):
        self.player.audio_set_volume(value)
        self.lbl_vol_val.setText(f"{value}%")
        self.lbl_vol_icon.setText("🔇" if value == 0 else "🔊")

    def toggle_mute(self):
        is_muted = self.player.audio_get_mute()
        self.player.audio_set_mute(not is_muted)
        if not is_muted:
            self.lbl_vol_icon.setText("🔇")
        else:
            self.lbl_vol_icon.setText("🔊")

    def adjust_volume(self, delta: int):
        cur = self.vol_slider.value()
        new_val = max(0, min(125, cur + delta))
        self.vol_slider.setValue(new_val)

    def handle_wheel_volume(self, delta: int):
        step = 5 if delta > 0 else -5
        self.adjust_volume(step)

    def cycle_speed(self):
        speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
        try:
            idx = speeds.index(self.current_speed)
            next_speed = speeds[(idx + 1) % len(speeds)]
        except ValueError:
            next_speed = 1.0
        self.set_speed(next_speed)

    def set_speed(self, rate: float):
        self.current_speed = rate
        self.player.set_rate(rate)
        self.btn_speed.setText(f"{rate}x")
        self.lbl_status.setText(f"Speed: {rate}x")

    def adjust_speed(self, delta: float):
        new_rate = max(0.25, min(4.0, self.current_speed + delta))
        self.set_speed(new_rate)

    def set_aspect_ratio(self, ratio: str):
        val = "" if ratio == "Default" else ratio
        self.player.video_set_aspect_ratio(val)
        self.lbl_status.setText(f"Aspect Ratio: {ratio}")

    def toggle_fullscreen(self):
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()

    def show_audio_tracks_menu(self):
        menu = QMenu(self)
        tracks = self.player.audio_get_track_description() or []
        cur_track = self.player.audio_get_track()
        for track_id, track_name in tracks:
            name_str = track_name.decode('utf-8', errors='ignore') if isinstance(track_name, bytes) else str(track_name)
            act = menu.addAction(name_str)
            act.setCheckable(True)
            if track_id == cur_track:
                act.setChecked(True)
            act.triggered.connect(lambda checked, tid=track_id: self.player.audio_set_track(tid))
        menu.exec(QCursor.pos())

    def show_subtitle_menu(self):
        menu = QMenu(self)
        tracks = self.player.video_get_spu_description() or []
        cur_track = self.player.video_get_spu()
        for track_id, track_name in tracks:
            name_str = track_name.decode('utf-8', errors='ignore') if isinstance(track_name, bytes) else str(track_name)
            act = menu.addAction(name_str)
            act.setCheckable(True)
            if track_id == cur_track:
                act.setChecked(True)
            act.triggered.connect(lambda checked, tid=track_id: self.player.video_set_spu(tid))
        
        menu.addSeparator()
        act_ext = menu.addAction("Add External Subtitle File...")
        act_ext.triggered.connect(self.add_subtitle_file)
        menu.exec(QCursor.pos())

    def add_subtitle_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Subtitle File", "", "Subtitles (*.srt *.vtt *.ass *.ssa *.sub)")
        if file_path:
            self.player.add_slave(vlc.MediaSlaveType.subtitle, file_path, True)
            self.lbl_status.setText(f"Loaded subtitle: {os.path.basename(file_path)}")

    # -------------------------------------------------------------
    # Clipboard Watcher
    # -------------------------------------------------------------
    def on_clipboard_changed(self):
        text = QApplication.clipboard().text().strip()
        if not text or text == self.last_clipboard_url or text == self.current_url:
            return

        is_video = (
            text.startswith("http://") or text.startswith("https://")
        ) and any(kw in text.lower() for kw in [
            "youtube.com", "youtu.be", ".m3u8", ".mp4", ".webm", ".mkv",
            "vimeo.com", "mega.nz", "t.me", "twitch.tv", "dailymotion.com"
        ])

        if is_video:
            self.last_clipboard_url = text
            short_url = text if len(text) < 45 else text[:42] + "..."
            self.clip_label.setText(f"📋 Found video link: {short_url}")
            self.clip_banner.show()

    def play_clipboard_url(self):
        if self.last_clipboard_url:
            self.clip_banner.hide()
            self.url_input.setText(self.last_clipboard_url)
            self.start_stream(self.last_clipboard_url)

    # -------------------------------------------------------------
    # History & Playlists (SQLite)
    # -------------------------------------------------------------
    def toggle_drawer(self):
        if self.drawer_widget.isVisible():
            self.drawer_widget.hide()
            self.btn_toggle_drawer.setChecked(False)
        else:
            self.drawer_widget.show()
            self.btn_toggle_drawer.setChecked(True)
            self.refresh_history()

    def save_to_history(self, url: str, title: str, uploader: str, duration_str: str):
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO history (url, title, uploader, duration_str)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(url) DO UPDATE SET
                    title=excluded.title,
                    uploader=excluded.uploader,
                    created_at=CURRENT_TIMESTAMP
            ''', (url, title, uploader, duration_str))
            conn.commit()
            conn.close()
            self.refresh_history()
        except Exception:
            pass

    def refresh_history(self):
        self.history_list.clear()
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute('SELECT url, title, duration_str FROM history ORDER BY created_at DESC LIMIT 50')
            rows = cur.fetchall()
            conn.close()
            for url, title, dur in rows:
                item_title = title or url
                item = QListWidgetItem(f"▶ {item_title} ({dur or '--:--'})")
                item.setData(Qt.ItemDataRole.UserRole, url)
                item.setToolTip(url)
                self.history_list.addItem(item)
        except Exception:
            pass

    def on_history_item_clicked(self, item: QListWidgetItem):
        url = item.data(Qt.ItemDataRole.UserRole)
        if url:
            self.url_input.setText(url)
            self.start_stream(url)

    def on_playlist_item_clicked(self, item: QListWidgetItem):
        url = item.data(Qt.ItemDataRole.UserRole)
        if url:
            self.url_input.setText(url)
            self.start_stream(url)

    # -------------------------------------------------------------
    # Dialogs & Info
    # -------------------------------------------------------------
    def show_stream_info(self):
        info_text = f"Title: {self.current_title}\n"
        info_text += f"Source URL: {self.current_url or 'None'}\n"
        info_text += f"LibVLC Version: {vlc.libvlc_get_version().decode()}\n"
        info_text += f"State: {str(self.player.get_state())}\n"
        info_text += f"Speed: {self.current_speed}x\n"
        info_text += f"Volume: {self.vol_slider.value()}%\n"
        QMessageBox.information(self, "Media Information", info_text)

    def show_about(self):
        about_text = (
            "<h3>PVP Media Player (Online VLC)</h3>"
            "<p>Customized exclusively for Universal Online Video Streaming.</p>"
            "<p><b>Features:</b></p>"
            "<ul>"
            "<li>Direct Direct3D 11 hardware-accelerated playback via LibVLC</li>"
            "<li>Zero web server, zero localhost connection errors</li>"
            "<li>Automatic ad filtering and tracking blocker</li>"
            "<li>YouTube, Vimeo, HLS (.m3u8), Direct MP4, Mega.nz, DooPlay, Telegram</li>"
            "<li>Windows clipboard auto-detection</li>"
            "<li>Persistent SQLite History & Playlists</li>"
            "</ul>"
            "<p>Engine: VideoLAN LibVLC 3.0 • yt-dlp • PyQt6</p>"
        )
        QMessageBox.about(self, "About PVP Player", about_text)


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("PVP-Player")
    app.setOrganizationName("PVP")

    window = PVPPlayerWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == '__main__':
    main()
