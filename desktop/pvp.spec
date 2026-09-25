# -*- mode: python ; coding: utf-8 -*-

import os
from PyInstaller.utils.hooks import collect_submodules

desktop_dir = SPECPATH
base_dir = os.path.dirname(desktop_dir)

block_cipher = None

hiddenimports = (
    collect_submodules('fastapi') +
    collect_submodules('uvicorn') +
    collect_submodules('yt_dlp') +
    collect_submodules('starlette') +
    collect_submodules('pydantic') +
    ['pystray', 'PIL']
)

datas = [
    (os.path.join(base_dir, 'app'), 'app'),
]

data_dir = os.path.join(base_dir, 'data')
if os.path.exists(data_dir):
    datas.append((data_dir, 'data'))

a = Analysis(
    [os.path.join(desktop_dir, 'pvp_desktop.py')],
    pathex=[base_dir],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
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
)
