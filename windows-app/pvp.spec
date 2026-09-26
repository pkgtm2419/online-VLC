# -*- mode: python ; coding: utf-8 -*-

import os
from PyInstaller.utils.hooks import collect_submodules

project_dir = SPECPATH
base_dir = project_dir

block_cipher = None

hiddenimports = (
    collect_submodules('yt_dlp') +
    collect_submodules('bs4') +
    [
        'PyQt6.QtWidgets', 'PyQt6.QtCore', 'PyQt6.QtGui', 'PyQt6.sip',
        'vlc', 'sqlite3', 'PIL', 'soupsieve'
    ]
)

datas = [
    (os.path.join(project_dir, 'app'), 'app'),
    (os.path.join(project_dir, 'libvlc'), 'libvlc'),
]

data_dir = os.path.join(project_dir, 'data')
if os.path.exists(data_dir):
    datas.append((data_dir, 'data'))

excludes = [
    'PyQt6.QtSql', 'PyQt6.QtNetwork', 'PyQt6.QtQml', 'PyQt6.QtQuick',
    'PyQt6.QtDesigner', 'PyQt6.QtBluetooth', 'PyQt6.QtNfc', 'PyQt6.QtPositioning',
    'PyQt6.QtSensors', 'PyQt6.QtSerialPort', 'PyQt6.QtWebChannel', 'PyQt6.QtWebEngine',
    'PyQt6.QtWebEngineCore', 'PyQt6.QtWebEngineWidgets', 'PyQt6.QtXml', 'PyQt6.QtPdf',
    'PyQt6.QtTest', 'PyQt6.QtOpenGL', 'PyQt6.QtOpenGLWidgets', 'PyQt6.QtPrintSupport',
    'fastapi', 'uvicorn', 'starlette'
]

a = Analysis(
    [os.path.join(project_dir, 'pvp_player.py')],
    pathex=[project_dir],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=excludes,
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='PVP-Player',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(project_dir, 'app', 'static', 'logo.ico'),
)
