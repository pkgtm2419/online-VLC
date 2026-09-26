/**
 * PVP (Personal Video Player) - Client Logic
 * Authentic VLC Media Player layout, shortcuts, playlist support,
 * true VLC fullscreen mode with 5s cursor/footer autohide, and robust duration/seeking.
 */

// Base URL for API requests (100% local, no cloud/Render dependencies)
let API_BASE = '';
if (typeof window !== 'undefined') {
  const savedServer = localStorage.getItem('pvp_local_server_url');
  if (window.location.protocol === 'file:') {
    API_BASE = savedServer || 'http://127.0.0.1:8000';
  } else if (savedServer) {
    API_BASE = savedServer;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - VLC Window & Menubar
  const vlcWindow = document.getElementById('vlcWindow');
  const windowTitle = document.getElementById('windowTitle');
  const btnMenuBarStream = document.getElementById('btnMenuBarStream');
  const btnMenuBarPastePlay = document.getElementById('btnMenuBarPastePlay');

  // Menubar items
  const menuOpenStream = document.getElementById('menuOpenStream');
  const menuTogglePlaylist = document.getElementById('menuTogglePlaylist');
  const menuStopVideo = document.getElementById('menuStopVideo');
  const menuPlayPause = document.getElementById('menuPlayPause');
  const menuStop = document.getElementById('menuStop');
  const menuPrev = document.getElementById('menuPrev');
  const menuNext = document.getElementById('menuNext');
  const menuFaster = document.getElementById('menuFaster');
  const menuSlower = document.getElementById('menuSlower');
  const menuNormal = document.getElementById('menuNormal');
  const menuMute = document.getElementById('menuMute');
  const menuVolUp = document.getElementById('menuVolUp');
  const menuVolDown = document.getElementById('menuVolDown');
  const menuFullscreen = document.getElementById('menuFullscreen');
  const menuViewPlaylist = document.getElementById('menuViewPlaylist');
  const menuAbout = document.getElementById('menuAbout');

  // Center display area
  const vlcDisplay = document.getElementById('vlcDisplay');
  const coneScreen = document.getElementById('coneScreen');
  const btnQuickOpen = document.getElementById('btnQuickOpen');
  const btnQuickPastePlay = document.getElementById('btnQuickPastePlay');
  const clipboardBanner = document.getElementById('clipboardBanner');
  const clipboardUrlText = document.getElementById('clipboardUrlText');
  const btnClipboardPlay = document.getElementById('btnClipboardPlay');
  const btnClipboardDismiss = document.getElementById('btnClipboardDismiss');
  const videoPlayer = document.getElementById('videoPlayer');
  const embedFrame = document.getElementById('embedFrame');
  const videoLoader = document.getElementById('videoLoader');
  const loaderMsg = document.getElementById('loaderMsg');
  const unmutePrompt = document.getElementById('unmutePrompt');
  const btnUnmute = document.getElementById('btnUnmute');

  // Playlist Panel
  const playlistPanel = document.getElementById('playlistPanel');
  const playlistTitle = document.getElementById('playlistTitle');
  const playlistCount = document.getElementById('playlistCount');
  const playlistItems = document.getElementById('playlistItems');
  const btnClosePlaylist = document.getElementById('btnClosePlaylist');

  // Bottom controls toolbar
  const vlcControls = document.getElementById('vlcControls');
  const timeElapsed = document.getElementById('timeElapsed');
  const timeTotal = document.getElementById('timeTotal');
  const progressBar = document.getElementById('progressBar');
  const seekSlider = document.getElementById('seekSlider');

  const btnPlayPause = document.getElementById('btnPlayPause');
  const playSvg = document.getElementById('playSvg');
  const pauseSvg = document.getElementById('pauseSvg');
  const btnPrev = document.getElementById('btnPrev');
  const btnStop = document.getElementById('btnStop');
  const btnNext = document.getElementById('btnNext');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnPlaylistToggle = document.getElementById('btnPlaylistToggle');
  const btnLoop = document.getElementById('btnLoop');
  const loopBadge = document.getElementById('loopBadge');
  const btnOpenStreamBar = document.getElementById('btnOpenStreamBar');

  const btnSpeedDown = document.getElementById('btnSpeedDown');
  const speedValue = document.getElementById('speedValue');
  const btnSpeedUp = document.getElementById('btnSpeedUp');
  const qualitySelect = document.getElementById('qualitySelect');

  const btnMute = document.getElementById('btnMute');
  const volHighSvg = document.getElementById('volHighSvg');
  const volMuteSvg = document.getElementById('volMuteSvg');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumePercent = document.getElementById('volumePercent');

  // Network Stream Modal Dialog
  const streamModal = document.getElementById('streamModal');
  const urlModalInput = document.getElementById('urlModalInput');
  const btnModalPaste = document.getElementById('btnModalPaste');
  const btnModalPasteStream = document.getElementById('btnModalPasteStream');
  const btnModalStream = document.getElementById('btnModalStream');
  const modalBtnText = document.getElementById('modalBtnText');
  const modalSpinner = document.getElementById('modalSpinner');
  const btnModalCancel = document.getElementById('btnModalCancel');
  const btnModalClose = document.getElementById('btnModalClose');
  const modalError = document.getElementById('modalError');

  // Audio & Subtitle Controls & OSD
  const audioTrackSelect = document.getElementById('audioTrackSelect');
  const btnSubtitles = document.getElementById('btnSubtitles');
  const subtitleSelect = document.getElementById('subtitleSelect');
  const vlcSubtitleOverlay = document.getElementById('vlcSubtitleOverlay');
  const vlcOsd = document.getElementById('vlcOsd');
  const subFileInput = document.getElementById('subFileInput');

  // Menubar Audio & Subtitle elements
  const menuAudioTracksList = document.getElementById('menuAudioTracksList');
  const menuCycleAudio = document.getElementById('menuCycleAudio');
  const menuAddSubtitleFile = document.getElementById('menuAddSubtitleFile');
  const menuSubtitleTracksList = document.getElementById('menuSubtitleTracksList');
  const menuCycleSubtitle = document.getElementById('menuCycleSubtitle');
  const menuSubDelayDown = document.getElementById('menuSubDelayDown');
  const menuSubDelayUp = document.getElementById('menuSubDelayUp');
  const menuSubtitleSettings = document.getElementById('menuSubtitleSettings');

  // Subtitle Settings Modal Elements
  const subSettingsModal = document.getElementById('subSettingsModal');
  const btnSubSettingsClose = document.getElementById('btnSubSettingsClose');
  const btnSubSettingsClose2 = document.getElementById('btnSubSettingsClose2');
  const modalAudioSelect = document.getElementById('modalAudioSelect');
  const btnModalCycleAudio = document.getElementById('btnModalCycleAudio');
  const modalSubSelect = document.getElementById('modalSubSelect');
  const btnModalCycleSub = document.getElementById('btnModalCycleSub');
  const btnBrowseSub = document.getElementById('btnBrowseSub');
  const subFileName = document.getElementById('subFileName');
  const subDelayDisplay = document.getElementById('subDelayDisplay');
  const subDelaySlider = document.getElementById('subDelaySlider');
  const btnSubDelayMinus = document.getElementById('btnSubDelayMinus');
  const btnSubDelayPlus = document.getElementById('btnSubDelayPlus');
  const btnSubDelayReset = document.getElementById('btnSubDelayReset');
  const subSizeSelect = document.getElementById('subSizeSelect');
  const subColorSelect = document.getElementById('subColorSelect');
  const subBgSelect = document.getElementById('subBgSelect');
  const subPreviewBox = document.getElementById('subPreviewBox');
  const subPreviewText = document.getElementById('subPreviewText');

  // State Management
  let hlsInstance = null;
  let currentPlaylist = [];
  let currentTrackIndex = -1;
  let currentQualities = [];
  let currentQualityIndex = 0;
  let currentMediaDuration = 0;
  let currentStreamSeekOffset = 0;
  let isSeeking = false;
  let showRemainingTime = false;
  let loopMode = 'off'; // 'off' | 'all' | 'one'
  let currentPlaybackRate = 1.0;
  let fullscreenHideTimer = null;

  // Audio & Subtitle State
  let availableAudioTracks = [];
  let currentAudioTrack = -1;
  let availableSubTracks = [];
  let currentSubTrack = -1;
  let customSubtitles = [];
  let subtitleDelayMs = 0;
  let osdTimer = null;

  // 1. Initial State: Open Network Stream Modal automatically on page load
  const urlParams = new URLSearchParams(window.location.search);
  const autoUrl = urlParams.get('url');
  if (autoUrl) {
    urlModalInput.value = autoUrl;
    setTimeout(() => {
      handleStreamSubmit();
    }, 100);
  } else {
    openStreamModal();
    setTimeout(() => urlModalInput.focus(), 200);
  }

  // Modal Open/Close Controls
  function openStreamModal() {
    modalError.classList.add('hidden');
    streamModal.classList.remove('hidden');
    urlModalInput.focus();
    urlModalInput.select();
  }

  function closeStreamModal() {
    streamModal.classList.add('hidden');
  }

  btnModalCancel.addEventListener('click', closeStreamModal);
  btnModalClose.addEventListener('click', closeStreamModal);
  btnQuickOpen.addEventListener('click', openStreamModal);
  btnOpenStreamBar.addEventListener('click', openStreamModal);
  menuOpenStream.addEventListener('click', openStreamModal);
  if (btnMenuBarStream) {
    btnMenuBarStream.addEventListener('click', openStreamModal);
  }

  // Paste button inside modal
  btnModalPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlModalInput.value = text.trim();
        urlModalInput.focus();
      }
    } catch {
      urlModalInput.focus();
    }
  });

  urlModalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStreamSubmit();
    }
  });

  btnModalStream.addEventListener('click', handleStreamSubmit);

  // Instant One-Tap Paste & Play (BlackHole Style)
  async function pasteAndPlay() {
    try {
      const text = await navigator.clipboard.readText();
      const cleanUrl = text ? text.trim() : '';
      if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
        showVlcOsd('Clipboard does not contain a video URL');
        openStreamModal();
        return;
      }
      closeStreamModal();
      if (clipboardBanner) clipboardBanner.classList.add('hidden');
      urlModalInput.value = cleanUrl;
      showVlcOsd('Streaming URL from clipboard...');
      handleStreamSubmit();
    } catch (err) {
      openStreamModal();
      urlModalInput.focus();
      showModalError('Please paste your video URL into the box above.');
    }
  }

  if (btnQuickPastePlay) {
    btnQuickPastePlay.addEventListener('click', pasteAndPlay);
  }
  if (btnMenuBarPastePlay) {
    btnMenuBarPastePlay.addEventListener('click', pasteAndPlay);
  }
  if (btnModalPasteStream) {
    btnModalPasteStream.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && (text.trim().startsWith('http://') || text.trim().startsWith('https://'))) {
          urlModalInput.value = text.trim();
        }
      } catch (_) {}
      handleStreamSubmit();
    });
  }

  // BlackHole-Style Clipboard Auto-Detection on Focus
  let lastDetectedClipboardUrl = '';
  let dismissedClipboardUrl = '';

  async function checkClipboardForVideoUrl() {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) return;
      if (!videoPlayer.paused && videoPlayer.currentTime > 0) return;
      const text = (await navigator.clipboard.readText() || '').trim();
      if (!text || (!text.startsWith('http://') && !text.startsWith('https://'))) return;
      if (text === dismissedClipboardUrl || text === lastDetectedClipboardUrl) return;

      const isLikelyVideo = /(?:youtube\.com|youtu\.be|instagram\.com|tiktok\.com|twitter\.com|x\.com|facebook\.com|fb\.watch|reddit\.com|vimeo\.com|dailymotion\.com|\.mp4|\.m3u8|\.mkv|\.mov|\.webm|\/video\/|\/reel\/|\/watch|\/download\/)/i.test(text);
      if (isLikelyVideo) {
        lastDetectedClipboardUrl = text;
        if (clipboardUrlText) {
          clipboardUrlText.textContent = text.length > 50 ? text.slice(0, 48) + '...' : text;
        }
        if (clipboardBanner) {
          clipboardBanner.classList.remove('hidden');
        }
      }
    } catch (_) {}
  }

  if (btnClipboardPlay) {
    btnClipboardPlay.addEventListener('click', () => {
      if (clipboardBanner) clipboardBanner.classList.add('hidden');
      if (lastDetectedClipboardUrl) {
        urlModalInput.value = lastDetectedClipboardUrl;
        handleStreamSubmit();
      }
    });
  }

  if (btnClipboardDismiss) {
    btnClipboardDismiss.addEventListener('click', () => {
      dismissedClipboardUrl = lastDetectedClipboardUrl;
      if (clipboardBanner) clipboardBanner.classList.add('hidden');
    });
  }

  window.addEventListener('focus', () => {
    setTimeout(checkClipboardForVideoUrl, 400);
  });

  // Resolve media client-side without any backend server (100% offline & local)
  function resolveMediaClientSide(url, fallbackTitle) {
    if (!url) return null;
    const rawUrl = url.trim();

    // YouTube
    const isYouTube = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/.exec(rawUrl);
    if (isYouTube) {
      const ytId = isYouTube[1];
      return {
        success: true,
        title: fallbackTitle || 'YouTube Video',
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Embed)',
          type: 'embed',
          video_url: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`
        }],
        default_quality_index: 0
      };
    }

    // Mega.nz shared files
    const megaMatch = rawUrl.match(/mega\.nz\/(?:file|embed)\/([a-zA-Z0-9_-]+)#([a-zA-Z0-9_-]+)/i) || rawUrl.match(/mega\.nz\/#\!([a-zA-Z0-9_-]+)\!([a-zA-Z0-9_-]+)/i);
    if (megaMatch) {
      const fileId = megaMatch[1];
      const fileKey = megaMatch[2];
      return {
        success: true,
        title: fallbackTitle || `Mega Video (${fileId})`,
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Mega Embed)',
          type: 'embed',
          video_url: `https://mega.nz/embed/${fileId}#${fileKey}`
        }],
        default_quality_index: 0
      };
    }

    // Telegram public post/channel video links
    const tgMatch = rawUrl.match(/t\.me\/(?:c\/\d+\/|)([a-zA-Z0-9_]+)\/(\d+)/i);
    if (tgMatch) {
      const channel = tgMatch[1];
      const msgId = tgMatch[2];
      return {
        success: true,
        title: fallbackTitle || `Telegram Video (@${channel}/${msgId})`,
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Telegram Embed)',
          type: 'embed',
          video_url: `https://t.me/${channel}/${msgId}?embed=1`
        }],
        default_quality_index: 0
      };
    }

    // Google Drive
    const gdriveMatch = rawUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i) || rawUrl.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i);
    if (gdriveMatch) {
      const fileId = gdriveMatch[1];
      const streamUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      return {
        success: true,
        title: fallbackTitle || 'Google Drive Video',
        qualities: [{
          label: 'Direct Stream',
          type: 'direct',
          video_url: streamUrl,
          is_hls: false
        }],
        default_quality_index: 0
      };
    }

    // Dropbox
    if (rawUrl.includes('dropbox.com')) {
      let streamUrl = rawUrl;
      if (streamUrl.includes('dl=0')) streamUrl = streamUrl.replace('dl=0', 'raw=1');
      else if (!streamUrl.includes('dl=1') && !streamUrl.includes('raw=1')) {
        streamUrl += (streamUrl.includes('?') ? '&' : '?') + 'raw=1';
      }
      return {
        success: true,
        title: fallbackTitle || 'Dropbox Video',
        qualities: [{
          label: 'Direct Stream',
          type: 'direct',
          video_url: streamUrl,
          is_hls: false
        }],
        default_quality_index: 0
      };
    }

    // Vimeo
    const isVimeo = /vimeo\.com\/(?:video\/)?([0-9]+)/.exec(rawUrl);
    if (isVimeo) {
      return {
        success: true,
        title: fallbackTitle || 'Vimeo Video',
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Embed)',
          type: 'embed',
          video_url: `https://player.vimeo.com/video/${isVimeo[1]}?autoplay=1`
        }],
        default_quality_index: 0
      };
    }


    // Dailymotion
    const isDm = /dailymotion\.com\/video\/([a-zA-Z0-9]+)/.exec(rawUrl);
    if (isDm) {
      return {
        success: true,
        title: fallbackTitle || 'Dailymotion Video',
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Embed)',
          type: 'embed',
          video_url: `https://www.dailymotion.com/embed/video/${isDm[1]}?autoplay=1`
        }],
        default_quality_index: 0
      };
    }

    // Direct Media / HLS Stream (.m3u8, .mp4, etc.)
    const isHls = /\.m3u8($|\?)/i.test(rawUrl);
    const isDirect = isHls || /\.(mp4|webm|mov|mkv|ogg|mp3|flv|avi)($|\?)/i.test(rawUrl);
    if (isDirect || rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const cleanName = rawUrl.split('?')[0].split('/').pop() || 'Media Stream';
      return {
        success: true,
        title: fallbackTitle || decodeURIComponent(cleanName),
        qualities: [{
          label: isHls ? 'HLS Master' : 'Direct Stream',
          type: 'direct',
          video_url: rawUrl,
          is_hls: isHls
        }],
        default_quality_index: 0
      };
    }

    return null;
  }

  // Handle URL Submission (Single Video or Playlist)
  async function handleStreamSubmit() {
    const rawUrl = urlModalInput.value.trim();
    if (!rawUrl) {
      showModalError('Please enter or paste a valid video URL.');
      return;
    }

    modalError.classList.add('hidden');
    setModalLoading(true);

    try {
      let finalData = null;

      // Try local FastAPI backend server first
      try {
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 6000);
        const res = await fetch(API_BASE + '/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: rawUrl }),
          signal: timeoutController.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && (data.success || data.qualities?.length || data.entries?.length)) {
            finalData = data;
          }
        }
      } catch (netErr) {
        console.warn('Local server unreachable, attempting client-side playback:', netErr);
      }

      // Check if YouTube needs embed fallback
      const isYouTubeUrl = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/.exec(rawUrl);
      if (finalData && isYouTubeUrl && (!finalData.qualities?.length || (finalData.qualities?.length === 1 && finalData.qualities[0].label === 'Direct'))) {
        finalData = null; // Let client-side embed handle YouTube cleanly
      }

      // If backend was unreachable or returned incomplete data, resolve client-side
      if (!finalData) {
        finalData = resolveMediaClientSide(rawUrl);
      }

      if (!finalData) {
        throw new Error('Could not stream media. Make sure local PVP server is active on ' + (API_BASE || '127.0.0.1:8000') + ' or enter a direct video link.');
      }

      // Close modal immediately upon valid response
      closeStreamModal();

      if (finalData.is_playlist && finalData.entries && finalData.entries.length > 0) {
        // Handle Playlist
        setupPlaylist(finalData);
      } else {
        // Handle Single Video
        currentPlaylist = [{
          index: 0,
          title: finalData.title || 'Video',
          duration_str: finalData.duration_str || '--:--',
          url: rawUrl,
          data: finalData
        }];
        currentTrackIndex = 0;
        renderPlaylistUI();
        loadVideoData(finalData);
      }
    } catch (err) {
      console.error(err);
      showModalError(err.message || 'Could not stream media. Check the link.');
    } finally {
      setModalLoading(false);
    }
  }

  // Setup Playlist
  function setupPlaylist(data) {
    currentPlaylist = data.entries.map((entry, idx) => ({
      index: idx,
      title: entry.title,
      duration_str: entry.duration_str,
      url: entry.url,
      data: idx === 0 ? data : null
    }));

    currentTrackIndex = 0;
    playlistTitle.textContent = data.playlist_title || 'Playlist';
    playlistCount.textContent = `(${currentPlaylist.length} items)`;

    renderPlaylistUI();
    playlistPanel.classList.remove('hidden');

    loadVideoData(data);
  }

  // Render Playlist Table
  function renderPlaylistUI() {
    playlistItems.innerHTML = '';
    currentPlaylist.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = `playlist-item ${idx === currentTrackIndex ? 'active' : ''}`;
      
      const colNum = document.createElement('span');
      colNum.className = 'col-num';
      colNum.textContent = String(idx + 1);

      const colTitle = document.createElement('span');
      colTitle.className = 'col-title';
      colTitle.title = item.title || 'Track';
      colTitle.textContent = item.title || 'Track';

      const colDur = document.createElement('span');
      colDur.className = 'col-dur';
      colDur.textContent = item.duration_str || '--:--';

      row.appendChild(colNum);
      row.appendChild(colTitle);
      row.appendChild(colDur);

      row.addEventListener('click', () => {
        playTrackByIndex(idx);
      });
      playlistItems.appendChild(row);
    });
  }

  // Play Specific Track in Playlist
  async function playTrackByIndex(index) {
    if (index < 0 || index >= currentPlaylist.length) return;
    currentTrackIndex = index;
    renderPlaylistUI();

    const track = currentPlaylist[index];
    windowTitle.textContent = `${track.title} - PVP`;

    if (track.data && track.data.qualities) {
      loadVideoData(track.data);
      return;
    }

    showVideoLoader(`Loading track ${index + 1}: ${track.title}...`);
    try {
      let finalData = null;
      try {
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), 6000);
        const res = await fetch(API_BASE + '/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: track.url }),
          signal: timeoutController.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && (data.success || data.qualities?.length)) {
            finalData = data;
          }
        }
      } catch (_) {}

      const isYouTubeUrl = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/.exec(track.url);
      if (finalData && isYouTubeUrl && (!finalData.qualities?.length || (finalData.qualities?.length === 1 && finalData.qualities[0].label === 'Direct'))) {
        finalData = null;
      }

      if (!finalData) {
        finalData = resolveMediaClientSide(track.url, track.title);
      }

      if (finalData) {
        track.data = finalData;
        loadVideoData(finalData);
      } else {
        throw new Error('Track extraction failed');
      }
    } catch (e) {
      console.error(e);
      hideVideoLoader();
      alert(`Could not load track: ${track.title}`);
    }
  }

  // Next / Previous Playlist Navigation
  function playNextTrack() {
    if (currentPlaylist.length <= 1) {
      if (loopMode === 'one') {
        seekToTime(0);
        videoPlayer.play();
      }
      return;
    }

    if (currentTrackIndex + 1 < currentPlaylist.length) {
      playTrackByIndex(currentTrackIndex + 1);
    } else if (loopMode === 'all') {
      playTrackByIndex(0);
    }
  }

  function playPrevTrack() {
    const cur = videoPlayer.currentTime + currentStreamSeekOffset;
    if (cur > 3) {
      seekToTime(0);
      return;
    }
    if (currentTrackIndex > 0) {
      playTrackByIndex(currentTrackIndex - 1);
    } else if (loopMode === 'all') {
      playTrackByIndex(currentPlaylist.length - 1);
    }
  }

  btnNext.addEventListener('click', playNextTrack);
  btnPrev.addEventListener('click', playPrevTrack);
  menuNext.addEventListener('click', playNextTrack);
  menuPrev.addEventListener('click', playPrevTrack);

  // ==========================================
  // SQLITE PERSISTENT PLAYLIST LIBRARY UI
  // ==========================================
  const btnSaveCurrentPlaylist = document.getElementById('btnSaveCurrentPlaylist');
  const btnOpenSavedPlaylists = document.getElementById('btnOpenSavedPlaylists');
  const menuSavedPlaylists = document.getElementById('menuSavedPlaylists');
  const savedPlaylistsModal = document.getElementById('savedPlaylistsModal');
  const btnSavedPlaylistsClose = document.getElementById('btnSavedPlaylistsClose');
  const btnSavedPlaylistsDismiss = document.getElementById('btnSavedPlaylistsDismiss');
  const savedPlaylistsList = document.getElementById('savedPlaylistsList');

  async function saveCurrentPlaylistToLibrary() {
    if (!currentPlaylist || currentPlaylist.length === 0) {
      showOsd('No active playlist to save');
      return;
    }
    const defaultTitle = playlistTitle.textContent !== 'Playlist' ? playlistTitle.textContent : `Playlist (${new Date().toLocaleDateString()})`;
    const title = prompt('Enter a name for this playlist:', defaultTitle);
    if (!title || !title.trim()) return;

    try {
      const res = await fetch(API_BASE + '/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() })
      });
      if (!res.ok) throw new Error('Could not create playlist');
      const plData = await res.json();
      const plId = plData.id;

      for (let i = 0; i < currentPlaylist.length; i++) {
        const item = currentPlaylist[i];
        await fetch(`${API_BASE}/api/playlists/${plId}/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: item.url,
            title: item.title || `Track ${i + 1}`,
            duration: item.duration || 0,
            duration_str: item.duration_str || '--:--',
            position: i
          })
        });
      }
      showOsd(`Saved "${title.trim()}" to library!`);
    } catch (err) {
      showOsd('Error saving playlist to library');
    }
  }

  btnSaveCurrentPlaylist?.addEventListener('click', saveCurrentPlaylistToLibrary);

  async function openSavedPlaylistsLibrary() {
    savedPlaylistsModal?.classList.remove('hidden');
    if (!savedPlaylistsList) return;
    savedPlaylistsList.innerHTML = '<p style="color: #888; font-size: 13px; text-align: center; margin: 20px 0;">Loading playlists...</p>';

    try {
      const res = await fetch(API_BASE + '/api/playlists');
      if (!res.ok) throw new Error('Could not fetch playlists');
      const data = await res.json();
      const playlists = data.playlists || [];

      if (playlists.length === 0) {
        savedPlaylistsList.innerHTML = '<p style="color: #888; font-size: 13px; text-align: center; margin: 20px 0;">No saved playlists yet. Click "Save" in the playlist drawer to add one.</p>';
        return;
      }

      savedPlaylistsList.innerHTML = '';
      playlists.forEach(pl => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; margin-bottom: 6px; background: #222; border-radius: 4px; border: 1px solid #333;';
        
        const infoCol = document.createElement('div');
        infoCol.style.cssText = 'display: flex; flex-direction: column; gap: 2px; overflow: hidden;';
        
        const titleSpan = document.createElement('span');
        titleSpan.style.cssText = 'color: #ff8800; font-weight: bold; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;';
        titleSpan.textContent = pl.title;
        
        const metaSpan = document.createElement('span');
        metaSpan.style.cssText = 'color: #888; font-size: 11px;';
        metaSpan.textContent = `${pl.item_count} items • ${new Date(pl.created_at).toLocaleDateString()}`;
        
        infoCol.appendChild(titleSpan);
        infoCol.appendChild(metaSpan);

        const actionsCol = document.createElement('div');
        actionsCol.style.cssText = 'display: flex; gap: 6px; align-items: center; flex-shrink: 0;';

        const btnLoad = document.createElement('button');
        btnLoad.className = 'vlc-dialog-btn btn-primary-vlc';
        btnLoad.style.cssText = 'padding: 4px 10px; font-size: 11px;';
        btnLoad.textContent = 'Load & Play';
        btnLoad.addEventListener('click', async () => {
          try {
            const detailRes = await fetch(`${API_BASE}/api/playlists/${pl.id}`);
            if (!detailRes.ok) throw new Error('Failed to load playlist');
            const detailData = await detailRes.json();
            const formatted = {
              success: true,
              is_playlist: true,
              playlist_title: detailData.title,
              total_tracks: detailData.items.length,
              entries: detailData.items.map((it, idx) => ({
                index: idx,
                id: String(it.id),
                title: it.title,
                duration_str: it.duration_str || '--:--',
                url: it.url
              }))
            };
            savedPlaylistsModal?.classList.add('hidden');
            setupPlaylist(formatted);
          } catch (e) {
            alert('Could not load playlist: ' + e.message);
          }
        });

        const btnDelete = document.createElement('button');
        btnDelete.className = 'vlc-dialog-btn';
        btnDelete.style.cssText = 'padding: 4px 8px; font-size: 11px; color: #ff4444;';
        btnDelete.textContent = 'Delete';
        btnDelete.addEventListener('click', async () => {
          if (!confirm(`Delete playlist "${pl.title}"?`)) return;
          try {
            await fetch(`${API_BASE}/api/playlists/${pl.id}`, { method: 'DELETE' });
            openSavedPlaylistsLibrary();
          } catch (e) {}
        });

        actionsCol.appendChild(btnLoad);
        actionsCol.appendChild(btnDelete);

        row.appendChild(infoCol);
        row.appendChild(actionsCol);
        savedPlaylistsList.appendChild(row);
      });

    } catch (err) {
      savedPlaylistsList.innerHTML = '<p style="color: #ff5555; font-size: 13px; text-align: center; margin: 20px 0;">Error loading playlists from backend server.</p>';
    }
  }

  btnOpenSavedPlaylists?.addEventListener('click', openSavedPlaylistsLibrary);
  menuSavedPlaylists?.addEventListener('click', openSavedPlaylistsLibrary);
  btnSavedPlaylistsClose?.addEventListener('click', () => savedPlaylistsModal?.classList.add('hidden'));
  btnSavedPlaylistsDismiss?.addEventListener('click', () => savedPlaylistsModal?.classList.add('hidden'));


  videoPlayer.addEventListener('ended', () => {
    if (loopMode === 'one') {
      seekToTime(0);
      videoPlayer.play();
    } else {
      playNextTrack();
    }
  });

  // Loop Mode Toggle (Off -> All -> One)
  btnLoop.addEventListener('click', () => {
    if (loopMode === 'off') {
      loopMode = 'all';
      loopBadge.textContent = 'All';
      btnLoop.classList.add('active');
    } else if (loopMode === 'all') {
      loopMode = 'one';
      loopBadge.textContent = '1';
    } else {
      loopMode = 'off';
      loopBadge.textContent = 'Off';
      btnLoop.classList.remove('active');
    }
  });

  // Toggle Playlist Panel
  function togglePlaylist() {
    playlistPanel.classList.toggle('hidden');
  }

  btnPlaylistToggle.addEventListener('click', togglePlaylist);
  btnClosePlaylist.addEventListener('click', togglePlaylist);
  menuTogglePlaylist.addEventListener('click', togglePlaylist);
  menuViewPlaylist.addEventListener('click', togglePlaylist);

  // Load Video & Guaranteed Autoplay
  function loadVideoData(data) {
    coneScreen.classList.add('hidden');
    videoPlayer.classList.remove('hidden');
    windowTitle.textContent = `${data.title || 'Video'} - PVP`;

    // Extract exact duration from metadata
    currentMediaDuration = (typeof data.duration === 'number' && data.duration > 0) ? data.duration : 0;
    currentStreamSeekOffset = 0;

    if (currentMediaDuration > 0) {
      timeTotal.textContent = formatTime(currentMediaDuration);
    } else {
      timeTotal.textContent = data.duration_str || '00:00:00';
    }

    currentQualities = data.qualities || [];
    qualitySelect.innerHTML = '';

    currentQualities.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = q.label;
      qualitySelect.appendChild(opt);
    });

    currentQualityIndex = data.default_quality_index ?? 0;
    qualitySelect.value = currentQualityIndex;

    loadStreamQuality(currentQualityIndex, 0);
  }

  function loadStreamQuality(index, startTime = 0) {
    if (!currentQualities || !currentQualities[index]) return;
    currentQualityIndex = index;
    const q = currentQualities[index];

    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    videoPlayer.autoplay = true;

    if (q.type === 'embed') {
      videoPlayer.classList.add('hidden');
      videoPlayer.pause();
      if (embedFrame) {
        embedFrame.classList.remove('hidden');
        embedFrame.src = q.video_url;
      }
      hideVideoLoader();
      updatePlayPauseUI(true);
      return;
    } else {
      if (embedFrame) {
        embedFrame.classList.add('hidden');
        embedFrame.src = '';
      }
      videoPlayer.classList.remove('hidden');
    }

    if (q.is_hls) {
      currentStreamSeekOffset = 0;
      const hlsSource = q.video_url.startsWith('/') ? API_BASE + q.video_url : q.video_url;
      if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(hlsSource);
        hlsInstance.attachMedia(videoPlayer);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          updateAudioTracksFromHls();
          updateSubtitleTracksFromHls();
          if (startTime > 0) videoPlayer.currentTime = startTime;
          triggerAutoplay();
        });
        hlsInstance.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
          updateAudioTracksFromHls();
        });
        hlsInstance.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
          updateSubtitleTracksFromHls();
        });
      } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.src = hlsSource;
        if (startTime > 0) videoPlayer.currentTime = startTime;
        triggerAutoplay();
      }
    } else {
      // Direct stream or live muxed stream
      let streamUrl = q.play_url || q.video_url;
      if (streamUrl && streamUrl.startsWith('/')) {
        streamUrl = API_BASE + streamUrl;
      }
      if (q.type === 'mux' && startTime > 0) {
        currentStreamSeekOffset = startTime;
        const cleanBase = streamUrl.split('&start=')[0];
        streamUrl = `${cleanBase}&start=${startTime}`;
      } else {
        currentStreamSeekOffset = 0;
      }

      videoPlayer.src = streamUrl;
      videoPlayer.load();

      if (q.type !== 'mux' && startTime > 0) {
        videoPlayer.currentTime = startTime;
      }

      videoPlayer.addEventListener('canplay', () => {
        triggerAutoplay();
      }, { once: true });

      triggerAutoplay();
    }

    applyPlaybackSpeed(currentPlaybackRate);
  }

  qualitySelect.addEventListener('change', () => {
    const idx = parseInt(qualitySelect.value, 10);
    const cur = videoPlayer.currentTime + currentStreamSeekOffset;
    loadStreamQuality(idx, cur);
  });

  // =========================================================================
  // VLC Authentic On-Screen Display (OSD) Notification
  // =========================================================================
  function showVlcOsd(text) {
    if (!vlcOsd) return;
    vlcOsd.textContent = text;
    vlcOsd.classList.remove('hidden');
    vlcOsd.style.opacity = '1';
    clearTimeout(osdTimer);
    osdTimer = setTimeout(() => {
      vlcOsd.style.opacity = '0';
      setTimeout(() => vlcOsd.classList.add('hidden'), 350);
    }, 2200);
  }

  // =========================================================================
  // Audio Track Switching (HLS & Multi-track Streams)
  // =========================================================================
  function updateAudioTracksFromHls() {
    if (!hlsInstance) return;
    availableAudioTracks = hlsInstance.audioTracks || [];
    currentAudioTrack = hlsInstance.audioTrack;

    // 1. Toolbar Select
    audioTrackSelect.innerHTML = '';
    if (availableAudioTracks.length === 0) {
      const opt = document.createElement('option');
      opt.value = -1;
      opt.textContent = 'Audio: Default';
      audioTrackSelect.appendChild(opt);
    } else {
      availableAudioTracks.forEach((t, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        const langName = t.name || t.lang || `Track ${idx + 1}`;
        opt.textContent = `Audio: ${langName}`;
        if (idx === currentAudioTrack) opt.selected = true;
        audioTrackSelect.appendChild(opt);
      });
    }

    // 2. Modal Select
    modalAudioSelect.innerHTML = audioTrackSelect.innerHTML;

    // 3. Menubar Dropdown
    menuAudioTracksList.innerHTML = '';
    if (availableAudioTracks.length === 0) {
      const item = document.createElement('div');
      item.className = 'dropdown-item active';
      item.textContent = 'Default Track';
      menuAudioTracksList.appendChild(item);
    } else {
      availableAudioTracks.forEach((t, idx) => {
        const item = document.createElement('div');
        item.className = `dropdown-item ${idx === currentAudioTrack ? 'active' : ''}`;
        const langName = t.name || t.lang || `Track ${idx + 1}`;
        item.innerHTML = `${langName} ${idx === currentAudioTrack ? '✓' : ''}`;
        item.addEventListener('click', () => switchAudioTrack(idx));
        menuAudioTracksList.appendChild(item);
      });
    }
  }

  function switchAudioTrack(idx) {
    idx = parseInt(idx, 10);
    if (!hlsInstance || availableAudioTracks.length === 0) return;
    if (idx >= 0 && idx < availableAudioTracks.length) {
      hlsInstance.audioTrack = idx;
      currentAudioTrack = idx;
      audioTrackSelect.value = idx;
      modalAudioSelect.value = idx;
      const t = availableAudioTracks[idx];
      const langName = t.name || t.lang || `Track ${idx + 1}`;
      showVlcOsd(`Audio track: ${langName}`);
      updateAudioTracksFromHls();
    }
  }

  function cycleAudioTrack() {
    if (!hlsInstance || availableAudioTracks.length <= 1) return;
    const nextIdx = (currentAudioTrack + 1) % availableAudioTracks.length;
    switchAudioTrack(nextIdx);
  }

  audioTrackSelect.addEventListener('change', () => switchAudioTrack(audioTrackSelect.value));
  modalAudioSelect.addEventListener('change', () => switchAudioTrack(modalAudioSelect.value));
  btnModalCycleAudio.addEventListener('click', cycleAudioTrack);
  menuCycleAudio.addEventListener('click', cycleAudioTrack);

  // =========================================================================
  // Subtitle Tracks & Settings
  // =========================================================================
  function updateSubtitleTracksFromHls() {
    if (!hlsInstance) return;
    availableSubTracks = hlsInstance.subtitleTracks || [];
    currentSubTrack = hlsInstance.subtitleTrack;

    // 1. Toolbar Select
    subtitleSelect.innerHTML = '';
    const offOpt = document.createElement('option');
    offOpt.value = -1;
    offOpt.textContent = 'Sub: Off';
    subtitleSelect.appendChild(offOpt);

    availableSubTracks.forEach((t, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const langName = t.name || t.lang || `Track ${idx + 1}`;
      opt.textContent = `Sub: ${langName}`;
      if (idx === currentSubTrack) opt.selected = true;
      subtitleSelect.appendChild(opt);
    });

    if (customSubtitles.length > 0) {
      const customOpt = document.createElement('option');
      customOpt.value = 'custom';
      customOpt.textContent = 'Sub: Custom File';
      if (currentSubTrack === 'custom') customOpt.selected = true;
      subtitleSelect.appendChild(customOpt);
    }

    if (currentSubTrack === -1) offOpt.selected = true;

    // 2. Modal Select
    modalSubSelect.innerHTML = subtitleSelect.innerHTML;

    // 3. Menubar Dropdown
    menuSubtitleTracksList.innerHTML = '';
    const offItem = document.createElement('div');
    offItem.className = `dropdown-item ${currentSubTrack === -1 ? 'active' : ''}`;
    offItem.innerHTML = `Disable ${currentSubTrack === -1 ? '✓' : ''}`;
    offItem.addEventListener('click', () => switchSubtitleTrack(-1));
    menuSubtitleTracksList.appendChild(offItem);

    availableSubTracks.forEach((t, idx) => {
      const item = document.createElement('div');
      item.className = `dropdown-item ${idx === currentSubTrack ? 'active' : ''}`;
      const langName = t.name || t.lang || `Track ${idx + 1}`;
      item.innerHTML = `${langName} ${idx === currentSubTrack ? '✓' : ''}`;
      item.addEventListener('click', () => switchSubtitleTrack(idx));
      menuSubtitleTracksList.appendChild(item);
    });

    if (customSubtitles.length > 0) {
      const customItem = document.createElement('div');
      customItem.className = `dropdown-item ${currentSubTrack === 'custom' ? 'active' : ''}`;
      customItem.innerHTML = `Custom File ${currentSubTrack === 'custom' ? '✓' : ''}`;
      customItem.addEventListener('click', () => switchSubtitleTrack('custom'));
      menuSubtitleTracksList.appendChild(customItem);
    }

    // Highlight CC button if active
    if (currentSubTrack !== -1) {
      btnSubtitles.classList.add('active');
    } else {
      btnSubtitles.classList.remove('active');
    }
  }

  function switchSubtitleTrack(trackVal) {
    if (trackVal === 'custom') {
      currentSubTrack = 'custom';
      if (hlsInstance) hlsInstance.subtitleTrack = -1;
      showVlcOsd('Subtitle track: Custom file');
    } else {
      const idx = parseInt(trackVal, 10);
      currentSubTrack = idx;
      if (hlsInstance) {
        hlsInstance.subtitleTrack = idx;
      }
      if (idx === -1) {
        showVlcOsd('Subtitle track: Disable');
        vlcSubtitleOverlay.classList.add('hidden');
      } else if (availableSubTracks[idx]) {
        const langName = availableSubTracks[idx].name || availableSubTracks[idx].lang || `Track ${idx + 1}`;
        showVlcOsd(`Subtitle track: ${langName}`);
      }
    }
    updateSubtitleTracksFromHls();
  }

  function cycleSubtitleTrack() {
    let options = [-1];
    for (let i = 0; i < availableSubTracks.length; i++) options.push(i);
    if (customSubtitles.length > 0) options.push('custom');

    const curPos = options.indexOf(currentSubTrack);
    const nextPos = (curPos + 1) % options.length;
    switchSubtitleTrack(options[nextPos]);
  }

  subtitleSelect.addEventListener('change', () => switchSubtitleTrack(subtitleSelect.value));
  modalSubSelect.addEventListener('change', () => switchSubtitleTrack(modalSubSelect.value));
  btnModalCycleSub.addEventListener('click', cycleSubtitleTrack);
  menuCycleSubtitle.addEventListener('click', cycleSubtitleTrack);

  // Subtitle Synchronization / Delay
  function adjustSubtitleDelay(deltaMs) {
    subtitleDelayMs += deltaMs;
    subDelayDisplay.textContent = `${subtitleDelayMs >= 0 ? '+' : ''}${subtitleDelayMs} ms`;
    subDelaySlider.value = subtitleDelayMs;
    showVlcOsd(`Subtitle delay: ${subtitleDelayMs >= 0 ? '+' : ''}${subtitleDelayMs} ms`);
  }

  subDelaySlider.addEventListener('input', () => {
    subtitleDelayMs = parseInt(subDelaySlider.value, 10);
    subDelayDisplay.textContent = `${subtitleDelayMs >= 0 ? '+' : ''}${subtitleDelayMs} ms`;
  });

  btnSubDelayMinus.addEventListener('click', () => adjustSubtitleDelay(-50));
  btnSubDelayPlus.addEventListener('click', () => adjustSubtitleDelay(50));
  menuSubDelayDown.addEventListener('click', () => adjustSubtitleDelay(-50));
  menuSubDelayUp.addEventListener('click', () => adjustSubtitleDelay(50));
  btnSubDelayReset.addEventListener('click', () => {
    subtitleDelayMs = 0;
    subDelaySlider.value = 0;
    subDelayDisplay.textContent = '0 ms';
    showVlcOsd('Subtitle delay: 0 ms');
  });

  // External Subtitle File Loader (.srt / .vtt)
  btnBrowseSub.addEventListener('click', () => subFileInput.click());
  menuAddSubtitleFile.addEventListener('click', () => subFileInput.click());

  subFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      customSubtitles = parseSrtOrVtt(content);
      subFileName.textContent = `${file.name} (${customSubtitles.length} cues)`;
      switchSubtitleTrack('custom');
      showVlcOsd(`Loaded subtitles: ${file.name}`);
    };
    reader.readAsText(file);
  });

  // Subtitle Parser (SRT & WebVTT)
  function parseSrtOrVtt(content) {
    const text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = text.trim().split(/\n\s*\n/);
    const cues = [];

    function timeToSeconds(timeStr) {
      if (!timeStr) return 0;
      timeStr = timeStr.trim().replace(',', '.');
      const parts = timeStr.split(':');
      if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return 0;
    }

    blocks.forEach(block => {
      const lines = block.split('\n');
      let timeLineIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('-->')) {
          timeLineIdx = i;
          break;
        }
      }
      if (timeLineIdx !== -1) {
        const timeParts = lines[timeLineIdx].split('-->');
        if (timeParts.length === 2) {
          const start = timeToSeconds(timeParts[0]);
          const end = timeToSeconds(timeParts[1]);
          const cueText = lines.slice(timeLineIdx + 1).join('\n').replace(/<[^>]+>/g, '').trim();
          if (cueText) {
            cues.push({ start, end, text: cueText });
          }
        }
      }
    });

    return cues;
  }

  // Subtitle Appearance Customization
  subSizeSelect.addEventListener('change', () => {
    document.documentElement.style.setProperty('--sub-font-size', subSizeSelect.value);
  });
  subColorSelect.addEventListener('change', () => {
    document.documentElement.style.setProperty('--sub-color', subColorSelect.value);
  });
  subBgSelect.addEventListener('change', () => {
    document.documentElement.style.setProperty('--sub-bg', subBgSelect.value);
  });

  // Subtitle Settings Modal Open/Close
  function openSubSettingsModal() {
    subSettingsModal.classList.remove('hidden');
    updateAudioTracksFromHls();
    updateSubtitleTracksFromHls();
  }

  function closeSubSettingsModal() {
    subSettingsModal.classList.add('hidden');
  }

  btnSubtitles.addEventListener('click', openSubSettingsModal);
  menuSubtitleSettings.addEventListener('click', openSubSettingsModal);
  btnSubSettingsClose.addEventListener('click', closeSubSettingsModal);
  btnSubSettingsClose2.addEventListener('click', closeSubSettingsModal);

  // Autoplay handler with audio policy fallback
  function triggerAutoplay() {
    applyPlaybackSpeed(currentPlaybackRate);
    hideVideoLoader();

    const playPromise = videoPlayer.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        updatePlayPauseUI(true);
        unmutePrompt.classList.add('hidden');
      }).catch(err => {
        console.warn('Audio autoplay blocked, playing muted...', err);
        videoPlayer.muted = true;
        updateVolumeUI();
        videoPlayer.play().then(() => {
          updatePlayPauseUI(true);
          unmutePrompt.classList.remove('hidden');
        }).catch(e => console.error('Autoplay error:', e));
      });
    }
  }

  // Play / Pause Toggle
  function togglePlayPause() {
    if (videoPlayer.paused || videoPlayer.ended) {
      videoPlayer.play().then(() => updatePlayPauseUI(true));
    } else {
      videoPlayer.pause();
      updatePlayPauseUI(false);
    }
  }

  btnPlayPause.addEventListener('click', togglePlayPause);
  menuPlayPause.addEventListener('click', togglePlayPause);
  videoPlayer.addEventListener('click', togglePlayPause);

  videoPlayer.addEventListener('play', () => updatePlayPauseUI(true));
  videoPlayer.addEventListener('pause', () => updatePlayPauseUI(false));

  function updatePlayPauseUI(isPlaying) {
    if (isPlaying) {
      playSvg.classList.add('hidden');
      pauseSvg.classList.remove('hidden');
    } else {
      playSvg.classList.remove('hidden');
      pauseSvg.classList.add('hidden');
    }
  }

  // Stop Action (S)
  function stopPlayback() {
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    currentStreamSeekOffset = 0;
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    if (embedFrame) {
      embedFrame.src = '';
      embedFrame.classList.add('hidden');
    }
    videoPlayer.src = '';
    videoPlayer.classList.add('hidden');
    coneScreen.classList.remove('hidden');
    updatePlayPauseUI(false);
    windowTitle.textContent = 'PVP (Personal Video Player)';
    timeElapsed.textContent = '00:00:00';
    timeTotal.textContent = '00:00:00';
    progressBar.style.width = '0%';
    seekSlider.value = 0;

    // Reset Audio & Subtitle UI
    availableAudioTracks = [];
    currentAudioTrack = -1;
    availableSubTracks = [];
    currentSubTrack = -1;
    vlcSubtitleOverlay.classList.add('hidden');
    audioTrackSelect.innerHTML = '<option value="-1">Audio: Default</option>';
    subtitleSelect.innerHTML = '<option value="-1">Sub: Off</option>';
    modalAudioSelect.innerHTML = '<option value="-1">Audio: Default</option>';
    modalSubSelect.innerHTML = '<option value="-1">Sub: Off</option>';
    menuAudioTracksList.innerHTML = '<div class="dropdown-item active">Default</div>';
    menuSubtitleTracksList.innerHTML = '<div class="dropdown-item active">Disable</div>';
  }

  btnStop.addEventListener('click', stopPlayback);
  menuStop.addEventListener('click', stopPlayback);
  menuStopVideo.addEventListener('click', stopPlayback);

  // Time & Progress Slider Updates
  videoPlayer.addEventListener('timeupdate', () => {
    if (isSeeking) return;

    const cur = videoPlayer.currentTime + currentStreamSeekOffset;

    // Custom Subtitle Rendering Loop
    if (currentSubTrack === 'custom' && customSubtitles.length > 0) {
      const curWithDelay = cur + (subtitleDelayMs / 1000);
      const activeCue = customSubtitles.find(c => curWithDelay >= c.start && curWithDelay <= c.end);
      if (activeCue) {
        vlcSubtitleOverlay.textContent = activeCue.text;
        vlcSubtitleOverlay.classList.remove('hidden');
      } else {
        vlcSubtitleOverlay.classList.add('hidden');
      }
    } else if (currentSubTrack === -1) {
      vlcSubtitleOverlay.classList.add('hidden');
    }

    let dur = videoPlayer.duration;
    if (!isFinite(dur) || isNaN(dur) || dur <= 0) {
      dur = currentMediaDuration;
    }

    timeElapsed.textContent = formatTime(cur);

    if (dur > 0) {
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      progressBar.style.width = `${pct}%`;
      seekSlider.value = pct;

      if (showRemainingTime) {
        timeTotal.textContent = `-${formatTime(Math.max(0, dur - cur))}`;
      } else {
        timeTotal.textContent = formatTime(dur);
      }
    }
  });

  // Toggle Remaining vs Total time display on click
  timeTotal.addEventListener('click', () => {
    showRemainingTime = !showRemainingTime;
  });

  // Unified Seek Logic
  function seekToTime(targetTime) {
    let dur = videoPlayer.duration;
    if (!isFinite(dur) || isNaN(dur) || dur <= 0) {
      dur = currentMediaDuration;
    }
    if (dur > 0) {
      targetTime = Math.max(0, Math.min(dur, targetTime));
    }

    const q = currentQualities[currentQualityIndex];
    if (q && q.type === 'mux') {
      // For live muxed stream, reload stream with start parameter
      loadStreamQuality(currentQualityIndex, targetTime);
    } else {
      videoPlayer.currentTime = targetTime;
    }
  }

  // Seek Slider Events
  seekSlider.addEventListener('mousedown', () => { isSeeking = true; });
  seekSlider.addEventListener('touchstart', () => { isSeeking = true; });

  seekSlider.addEventListener('input', () => {
    let dur = videoPlayer.duration;
    if (!isFinite(dur) || isNaN(dur) || dur <= 0) {
      dur = currentMediaDuration;
    }
    if (dur > 0) {
      const targetTime = (parseFloat(seekSlider.value) / 100) * dur;
      timeElapsed.textContent = formatTime(targetTime);
      progressBar.style.width = `${seekSlider.value}%`;
    }
  });

  seekSlider.addEventListener('change', () => {
    isSeeking = false;
    let dur = videoPlayer.duration;
    if (!isFinite(dur) || isNaN(dur) || dur <= 0) {
      dur = currentMediaDuration;
    }
    if (dur > 0) {
      const targetTime = (parseFloat(seekSlider.value) / 100) * dur;
      seekToTime(targetTime);
    }
  });

  // Volume Controls (0% - 125% like VLC)
  volumeSlider.addEventListener('input', () => {
    const val = parseInt(volumeSlider.value, 10);
    videoPlayer.volume = Math.min(1.0, val / 100);
    videoPlayer.muted = false;
    updateVolumeUI();
  });

  function toggleMute() {
    videoPlayer.muted = !videoPlayer.muted;
    updateVolumeUI();
  }

  btnMute.addEventListener('click', toggleMute);
  menuMute.addEventListener('click', toggleMute);
  btnUnmute.addEventListener('click', () => {
    videoPlayer.muted = false;
    unmutePrompt.classList.add('hidden');
    updateVolumeUI();
  });

  function updateVolumeUI() {
    const isMuted = videoPlayer.muted || videoPlayer.volume === 0;
    if (isMuted) {
      volHighSvg.classList.add('hidden');
      volMuteSvg.classList.remove('hidden');
      volumePercent.textContent = '0%';
    } else {
      volHighSvg.classList.remove('hidden');
      volMuteSvg.classList.add('hidden');
      const val = parseInt(volumeSlider.value, 10);
      volumePercent.textContent = `${val}%`;
    }
  }

  // Playback Speed Controller ([ Slower, ] Faster, = Normal)
  function applyPlaybackSpeed(rate) {
    currentPlaybackRate = Math.max(0.25, Math.min(4.0, Math.round(rate * 100) / 100));
    videoPlayer.playbackRate = currentPlaybackRate;
    speedValue.textContent = `${currentPlaybackRate.toFixed(2)}x`;
  }

  btnSpeedUp.addEventListener('click', () => applyPlaybackSpeed(currentPlaybackRate + 0.1));
  btnSpeedDown.addEventListener('click', () => applyPlaybackSpeed(currentPlaybackRate - 0.1));
  menuFaster.addEventListener('click', () => applyPlaybackSpeed(currentPlaybackRate + 0.1));
  menuSlower.addEventListener('click', () => applyPlaybackSpeed(currentPlaybackRate - 0.1));
  menuNormal.addEventListener('click', () => applyPlaybackSpeed(1.0));

  document.querySelectorAll('.speed-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      const spd = parseFloat(opt.getAttribute('data-speed'));
      if (spd) applyPlaybackSpeed(spd);
    });
  });

  // =========================================================================
  // VLC Fullscreen Mode with 5-Second Footer / Cursor Auto-Hide
  // =========================================================================
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      if (vlcWindow.requestFullscreen) {
        vlcWindow.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  btnFullscreen.addEventListener('click', toggleFullscreen);
  menuFullscreen.addEventListener('click', toggleFullscreen);
  videoPlayer.addEventListener('dblclick', toggleFullscreen);

  function resetFullscreenInactivityTimer() {
    if (!document.fullscreenElement) {
      vlcWindow.classList.remove('fullscreen-mode', 'controls-hidden', 'hide-cursor');
      clearTimeout(fullscreenHideTimer);
      return;
    }

    // In fullscreen: reveal controls and cursor immediately upon mouse movement
    vlcWindow.classList.add('fullscreen-mode');
    vlcWindow.classList.remove('controls-hidden', 'hide-cursor');

    clearTimeout(fullscreenHideTimer);
    // Hide controls and cursor after 5 seconds of inactivity
    fullscreenHideTimer = setTimeout(() => {
      if (document.fullscreenElement && !videoPlayer.paused) {
        vlcWindow.classList.add('controls-hidden', 'hide-cursor');
      }
    }, 5000);
  }

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      vlcWindow.classList.add('fullscreen-mode');
      resetFullscreenInactivityTimer();
    } else {
      vlcWindow.classList.remove('fullscreen-mode', 'controls-hidden', 'hide-cursor');
      clearTimeout(fullscreenHideTimer);
    }
  });

  // Mouse move listener for fullscreen controls reveal
  vlcWindow.addEventListener('mousemove', () => {
    if (document.fullscreenElement) {
      resetFullscreenInactivityTimer();
    }
  });

  // Keyboard Shortcuts (Authentic VLC Media Player)
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        closeStreamModal();
      }
      return;
    }

    const ctrl = e.ctrlKey || e.metaKey;

    // Ctrl + N: Open Network Stream Modal
    if (ctrl && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      openStreamModal();
      return;
    }

    // Ctrl + L: Toggle Playlist
    if (ctrl && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      togglePlaylist();
      return;
    }

    // Ctrl + Up / Down: Volume +/- 5%
    if (ctrl && e.key === 'ArrowUp') {
      e.preventDefault();
      volumeSlider.value = Math.min(125, parseInt(volumeSlider.value, 10) + 5);
      volumeSlider.dispatchEvent(new Event('input'));
      return;
    }
    if (ctrl && e.key === 'ArrowDown') {
      e.preventDefault();
      volumeSlider.value = Math.max(0, parseInt(volumeSlider.value, 10) - 5);
      volumeSlider.dispatchEvent(new Event('input'));
      return;
    }

    // Ctrl + Left / Right: 1 minute jump
    if (ctrl && e.key === 'ArrowRight') {
      e.preventDefault();
      const cur = videoPlayer.currentTime + currentStreamSeekOffset;
      seekToTime(cur + 60);
      return;
    }
    if (ctrl && e.key === 'ArrowLeft') {
      e.preventDefault();
      const cur = videoPlayer.currentTime + currentStreamSeekOffset;
      seekToTime(Math.max(0, cur - 60));
      return;
    }

    // Standard VLC keys
    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlayPause();
        break;
      case 's':
      case 'S':
        e.preventDefault();
        stopPlayback();
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'm':
      case 'M':
        e.preventDefault();
        toggleMute();
        break;
      case 'n':
      case 'N':
        e.preventDefault();
        playNextTrack();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        playPrevTrack();
        break;
      case '[':
        e.preventDefault();
        applyPlaybackSpeed(currentPlaybackRate - 0.1);
        break;
      case ']':
        e.preventDefault();
        applyPlaybackSpeed(currentPlaybackRate + 0.1);
        break;
      case '=':
        e.preventDefault();
        applyPlaybackSpeed(1.0);
        break;
      case 'b':
      case 'B':
        e.preventDefault();
        cycleAudioTrack();
        break;
      case 'v':
      case 'V':
        e.preventDefault();
        cycleSubtitleTrack();
        break;
      case 'g':
      case 'G':
        e.preventDefault();
        adjustSubtitleDelay(-50);
        break;
      case 'h':
      case 'H':
        e.preventDefault();
        adjustSubtitleDelay(50);
        break;
      case 'ArrowRight':
        e.preventDefault();
        {
          const cur = videoPlayer.currentTime + currentStreamSeekOffset;
          seekToTime(cur + 10);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        {
          const cur = videoPlayer.currentTime + currentStreamSeekOffset;
          seekToTime(Math.max(0, cur - 10));
        }
        break;
      case 'Escape':
        closeStreamModal();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        break;
    }
  });

  // Helpers
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00:00';
    const s = Math.floor(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const h = hrs.toString().padStart(2, '0');
    const m = mins.toString().padStart(2, '0');
    const sc = secs.toString().padStart(2, '0');
    return `${h}:${m}:${sc}`;
  }

  function showVideoLoader(msg) {
    loaderMsg.textContent = msg || 'Loading ad-free video...';
    videoLoader.classList.remove('hidden');
  }

  function hideVideoLoader() {
    videoLoader.classList.add('hidden');
  }

  function setModalLoading(isLoading) {
    if (isLoading) {
      btnModalStream.disabled = true;
      modalSpinner.classList.remove('hidden');
      modalBtnText.textContent = '';
    } else {
      btnModalStream.disabled = false;
      modalSpinner.classList.add('hidden');
      modalBtnText.textContent = 'Stream';
    }
  }

  function showModalError(msg) {
    modalError.textContent = msg;
    modalError.classList.remove('hidden');
  }

  menuAbout.addEventListener('click', () => {
    alert('PVP (Personal Video Player)\nUniversal 100% Local Ad-Free Media Player\nAuthentic VLC Media Player interface with zero cloud dependencies.');
  });

  // Local Server & Network Settings Modal (Tools -> Local Server Settings)
  const menuServerSettings = document.getElementById('menuServerSettings');
  const serverModal = document.getElementById('serverModal');
  const btnServerModalClose = document.getElementById('btnServerModalClose');
  const localServerInput = document.getElementById('localServerInput');
  const serverStatusBadge = document.getElementById('serverStatusBadge');
  const btnServerReset = document.getElementById('btnServerReset');
  const btnServerSave = document.getElementById('btnServerSave');

  if (menuServerSettings && serverModal) {
    async function checkServerStatus(url) {
      if (!serverStatusBadge) return;
      serverStatusBadge.textContent = 'Checking server status...';
      serverStatusBadge.style.color = '#ff9900';
      serverStatusBadge.style.background = 'rgba(255,136,0,0.15)';
      serverStatusBadge.style.borderColor = 'rgba(255,136,0,0.3)';
      try {
        const pingUrl = (url ? url.replace(/\/+$/, '') : 'http://127.0.0.1:8000') + '/api/history';
        const timeoutController = new AbortController();
        const tid = setTimeout(() => timeoutController.abort(), 2500);
        const res = await fetch(pingUrl, { signal: timeoutController.signal });
        clearTimeout(tid);
        if (res.ok) {
          serverStatusBadge.textContent = '● Connected: Local PVP Server is active (' + pingUrl.replace('/api/history', '') + ')';
          serverStatusBadge.style.color = '#3ddc84';
          serverStatusBadge.style.background = 'rgba(61,220,132,0.15)';
          serverStatusBadge.style.borderColor = 'rgba(61,220,132,0.3)';
          return;
        }
      } catch (_) {}
      serverStatusBadge.textContent = '○ Standalone Mode: Direct native streams & embeds active';
      serverStatusBadge.style.color = '#ffaa00';
      serverStatusBadge.style.background = 'rgba(255,170,0,0.15)';
      serverStatusBadge.style.borderColor = 'rgba(255,170,0,0.3)';
    }

    menuServerSettings.addEventListener('click', () => {
      closeAllMenus();
      const current = localStorage.getItem('pvp_local_server_url') || (window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : window.location.origin);
      if (localServerInput) localServerInput.value = current;
      serverModal.classList.remove('hidden');
      checkServerStatus(current);
    });

    btnServerModalClose?.addEventListener('click', () => {
      serverModal.classList.add('hidden');
    });

    btnServerReset?.addEventListener('click', () => {
      localStorage.removeItem('pvp_local_server_url');
      const def = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : '';
      if (localServerInput) localServerInput.value = 'http://127.0.0.1:8000';
      API_BASE = def;
      checkServerStatus(API_BASE);
    });

    btnServerSave?.addEventListener('click', () => {
      const val = (localServerInput?.value || '').trim().replace(/\/+$/, '');
      if (val) {
        localStorage.setItem('pvp_local_server_url', val);
        API_BASE = val;
      } else {
        localStorage.removeItem('pvp_local_server_url');
        API_BASE = window.location.protocol === 'file:' ? 'http://127.0.0.1:8000' : '';
      }
      serverModal.classList.add('hidden');
    });
  }
});
