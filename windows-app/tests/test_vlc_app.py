import unittest
import os
import sys

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, base_dir)

import pvp_player
from app.extractor import normalize_storage_url, extract_video_info, DIRECT_MEDIA_REGEX

class TestWindowsVLCApp(unittest.TestCase):

    def test_libvlc_loaded(self):
        """Verify bundled LibVLC is loaded and returns a valid version."""
        version = pvp_player.vlc.libvlc_get_version()
        self.assertIsNotNone(version)
        version_str = version.decode('utf-8')
        self.assertTrue(version_str.startswith("3."), f"Expected LibVLC 3.x, got: {version_str}")

    def test_normalize_storage_url(self):
        """Verify cloud storage URLs are converted to direct stream links."""
        gdrive = "https://drive.google.com/file/d/XYZ123ABC/view"
        self.assertEqual(normalize_storage_url(gdrive), "https://drive.google.com/uc?export=download&id=XYZ123ABC")

        dropbox = "https://www.dropbox.com/s/sample/video.mp4?dl=0"
        self.assertEqual(normalize_storage_url(dropbox), "https://www.dropbox.com/s/sample/video.mp4?raw=1")

    def test_direct_media_regex(self):
        """Verify direct media detection for online stream protocols and files."""
        self.assertTrue(bool(DIRECT_MEDIA_REGEX.search("https://example.com/stream.m3u8")))
        self.assertTrue(bool(DIRECT_MEDIA_REGEX.search("https://example.com/video.mp4")))
        self.assertTrue(bool(DIRECT_MEDIA_REGEX.search("https://example.com/video.mpd?token=abc")))
        self.assertFalse(bool(DIRECT_MEDIA_REGEX.search("https://example.com/page.html")))

    def test_extract_direct_stream(self):
        """Verify direct stream URL extractor creates valid playback format dictionary."""
        url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        res = extract_video_info(url)
        self.assertTrue(res.get("success"))
        self.assertTrue(res.get("is_direct"))
        self.assertGreater(len(res.get("qualities", [])), 0)
        self.assertEqual(res["qualities"][0]["video_url"], url)

    def test_database_initialization(self):
        """Verify SQLite database initialized history and playlist tables."""
        import sqlite3
        conn = sqlite3.connect(pvp_player.DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cur.fetchall()}
        conn.close()
        self.assertIn("history", tables)
        self.assertIn("playlists", tables)
        self.assertIn("playlist_items", tables)

if __name__ == '__main__':
    unittest.main()
