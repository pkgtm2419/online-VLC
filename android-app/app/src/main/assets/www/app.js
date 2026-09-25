/**
 * PVP Mobile - Client Application Logic (Android 12+ Optimized)
 * 100% Local Playback, Global Settings Defaults, Background Play,
 * Bottom History List, Resume from Last Timestamp, and Robust Stream Handling.
 */

// Base URL for API requests (100% local, no cloud dependencies)
let API_BASE = '';
if (typeof window !== 'undefined') {
  const savedServer = localStorage.getItem('pvp_local_server_url');
  if (savedServer) {
    API_BASE = savedServer;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM: Views
  const homeView = document.getElementById('homeView');
  const playerView = document.getElementById('playerView');
  const playerCanvas = document.getElementById('playerCanvas');

  // DOM: Home Elements
  const urlInput = document.getElementById('urlInput');
  const btnClearInput = document.getElementById('btnClearInput');
  const btnPasteInput = document.getElementById('btnPasteInput');
  const btnStartStream = document.getElementById('btnStartStream');
  const streamBtnText = document.getElementById('streamBtnText');
  const homeSpinner = document.getElementById('homeSpinner');
  const homeErrorMsg = document.getElementById('homeErrorMsg');
  const btnHomePastePlay = document.getElementById('btnHomePastePlay');
  const btnOpenSettings = document.getElementById('btnOpenSettings');

  // DOM: Clipboard Banner
  const clipboardBanner = document.getElementById('clipboardBanner');
  const clipboardUrlText = document.getElementById('clipboardUrlText');
  const btnClipboardPlay = document.getElementById('btnClipboardPlay');
  const btnClipboardDismiss = document.getElementById('btnClipboardDismiss');

  // DOM: Bottom History Elements
  const historyList = document.getElementById('historyList');
  const btnShowAllHistory = document.getElementById('btnShowAllHistory');

  // DOM: Video & Embed
  const videoPlayer = document.getElementById('videoPlayer');
  const embedFrame = document.getElementById('embedFrame');
  const vlcSubtitleOverlay = document.getElementById('vlcSubtitleOverlay');
  const playerLoader = document.getElementById('playerLoader');
  const playerLoaderMsg = document.getElementById('playerLoaderMsg');
  const playerErrorOverlay = document.getElementById('playerErrorOverlay');
  const playerErrorMsg = document.getElementById('playerErrorMsg');
  const btnPlayerErrorBack = document.getElementById('btnPlayerErrorBack');
  const vlcOsd = document.getElementById('vlcOsd');

  // DOM: Gesture Feedback Overlays
  const volumeHud = document.getElementById('volumeHud');
  const volumeHudVal = document.getElementById('volumeHudVal');
  const brightnessHud = document.getElementById('brightnessHud');
  const brightnessHudVal = document.getElementById('brightnessHudVal');
  const rippleLeft = document.getElementById('rippleLeft');
  const rippleRight = document.getElementById('rippleRight');
  const playerGestureZone = document.getElementById('playerGestureZone');

  // DOM: Player HUD
  const playerHud = document.getElementById('playerHud');
  const btnPlayerBack = document.getElementById('btnPlayerBack');
  const playerTitle = document.getElementById('playerTitle');
  const btnAudioSheet = document.getElementById('btnAudioSheet');
  const btnSubSheet = document.getElementById('btnSubSheet');
  const btnSpeedSheet = document.getElementById('btnSpeedSheet');
  const hudSpeedLabel = document.getElementById('hudSpeedLabel');

  const btnHudRewind = document.getElementById('btnHudRewind');
  const btnHudPlayPause = document.getElementById('btnHudPlayPause');
  const hudPlaySvg = document.getElementById('hudPlaySvg');
  const hudPauseSvg = document.getElementById('hudPauseSvg');
  const btnHudForward = document.getElementById('btnHudForward');

  const timeElapsed = document.getElementById('timeElapsed');
  const timeTotal = document.getElementById('timeTotal');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const bufferBar = document.getElementById('bufferBar');
  const seekSlider = document.getElementById('seekSlider');

  const btnHudMute = document.getElementById('btnHudMute');
  const volHighSvg = document.getElementById('volHighSvg');
  const volMuteSvg = document.getElementById('volMuteSvg');
  const btnHudShare = document.getElementById('btnHudShare');
  const btnHudRotate = document.getElementById('btnHudRotate');
  const btnHudFullscreen = document.getElementById('btnHudFullscreen');

  // DOM: Bottom Sheets
  const sheetBackdrop = document.getElementById('sheetBackdrop');
  const audioSheet = document.getElementById('audioSheet');
  const subtitleSheet = document.getElementById('subtitleSheet');
  const speedSheet = document.getElementById('speedSheet');
  const settingsSheet = document.getElementById('settingsSheet');
  const historySheet = document.getElementById('historySheet');

  // DOM: Settings Controls
  const settingDefaultQuality = document.getElementById('settingDefaultQuality');
  const settingDefaultSpeed = document.getElementById('settingDefaultSpeed');
  const settingDefaultAudio = document.getElementById('settingDefaultAudio');
  const settingDefaultSub = document.getElementById('settingDefaultSub');
  const settingDefaultVolume = document.getElementById('settingDefaultVolume');
  const valSettingVolume = document.getElementById('valSettingVolume');
  const settingDefaultBrightness = document.getElementById('settingDefaultBrightness');
  const valSettingBrightness = document.getElementById('valSettingBrightness');
  const settingBackgroundPlay = document.getElementById('settingBackgroundPlay');
  const settingResumeBehavior = document.getElementById('settingResumeBehavior');

  const localServerInput = document.getElementById('localServerInput');
  const btnSaveServer = document.getElementById('btnSaveServer');
  const btnResetServer = document.getElementById('btnResetServer');

  // DOM: Full History Elements
  const historyTotalCount = document.getElementById('historyTotalCount');
  const btnClearAllHistory = document.getElementById('btnClearAllHistory');
  const fullHistoryList = document.getElementById('fullHistoryList');

  // DOM: Resume Modal Dialog
  const resumeModal = document.getElementById('resumeModal');
  const resumeVideoTitle = document.getElementById('resumeVideoTitle');
  const resumeTimeLabel = document.getElementById('resumeTimeLabel');
  const btnResumeLast = document.getElementById('btnResumeLast');
  const btnResumeStart = document.getElementById('btnResumeStart');
  const btnResumeCancel = document.getElementById('btnResumeCancel');

  // Subtitle custom loader controls
  const audioTracksList = document.getElementById('audioTracksList');
  const subtitleTracksList = document.getElementById('subtitleTracksList');
  const btnLoadCustomSub = document.getElementById('btnLoadCustomSub');
  const customSubLabel = document.getElementById('customSubLabel');
  const subFileInput = document.getElementById('subFileInput');
  const btnSubDelayMinus = document.getElementById('btnSubDelayMinus');
  const btnSubDelayPlus = document.getElementById('btnSubDelayPlus');
  const btnSubDelayReset = document.getElementById('btnSubDelayReset');
  const subDelayDisplay = document.getElementById('subDelayDisplay');
  const subSizeSelect = document.getElementById('subSizeSelect');
  const subColorSelect = document.getElementById('subColorSelect');
  const speedChips = document.querySelectorAll('.speed-chip');

  // App State
  let activeView = 'home';
  let hlsInstance = null;
  let activeSheet = null;
  let currentPlayingUrl = '';
  let currentPlayingTitle = '';
  let currentMediaDuration = 0;
  let isSeeking = false;
  let showRemainingTime = false;
  let currentPlaybackRate = 1.0;
  let currentBrightness = 1.0;
  let hudHideTimer = null;
  let osdTimer = null;
  let hudIndicatorTimer = null;
  let isLandscape = false;
  let isFullscreen = false;
  let pendingResumeItem = null;

  // Audio & Subtitle State
  let currentAudioTrack = -1;
  let currentSubTrack = -1;
  let customSubtitles = [];
  let subtitleDelayMs = 0;

  // ==========================================
  // GLOBAL SETTINGS CONFIGURATION
  // ==========================================
  const DEFAULT_APP_SETTINGS = {
    quality: 'auto',
    speed: '1.0',
    audio: 'default',
    sub: 'off',
    volume: 100,
    brightness: 100,
    backgroundPlay: false,
    resumeBehavior: 'last'
  };

  let appSettings = { ...DEFAULT_APP_SETTINGS };

  function loadAppSettings() {
    try {
      const stored = localStorage.getItem('pvp_app_settings');
      if (stored) {
        appSettings = { ...DEFAULT_APP_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (_) {}

    // Populate UI inputs
    if (settingDefaultQuality) settingDefaultQuality.value = appSettings.quality;
    if (settingDefaultSpeed) settingDefaultSpeed.value = appSettings.speed;
    if (settingDefaultAudio) settingDefaultAudio.value = appSettings.audio;
    if (settingDefaultSub) settingDefaultSub.value = appSettings.sub;
    if (settingDefaultVolume) {
      settingDefaultVolume.value = appSettings.volume;
      valSettingVolume.textContent = appSettings.volume + '%';
    }
    if (settingDefaultBrightness) {
      settingDefaultBrightness.value = appSettings.brightness;
      valSettingBrightness.textContent = appSettings.brightness + '%';
    }
    if (settingBackgroundPlay) settingBackgroundPlay.checked = !!appSettings.backgroundPlay;
    if (settingResumeBehavior) settingResumeBehavior.value = appSettings.resumeBehavior;

    // Apply native bridge background play setting
    if (window.PVPNative && typeof window.PVPNative.setBackgroundPlay === 'function') {
      window.PVPNative.setBackgroundPlay(!!appSettings.backgroundPlay);
    }
  }

  function saveAppSettings() {
    try {
      localStorage.setItem('pvp_app_settings', JSON.stringify(appSettings));
    } catch (_) {}

    // Sync to native bridge
    if (window.PVPNative && typeof window.PVPNative.setBackgroundPlay === 'function') {
      window.PVPNative.setBackgroundPlay(!!appSettings.backgroundPlay);
    }
  }

  // Settings change listeners
  settingDefaultQuality?.addEventListener('change', () => {
    appSettings.quality = settingDefaultQuality.value;
    saveAppSettings();
    triggerHaptic();
  });

  settingDefaultSpeed?.addEventListener('change', () => {
    appSettings.speed = settingDefaultSpeed.value;
    saveAppSettings();
    triggerHaptic();
  });

  settingDefaultAudio?.addEventListener('change', () => {
    appSettings.audio = settingDefaultAudio.value;
    saveAppSettings();
    triggerHaptic();
  });

  settingDefaultSub?.addEventListener('change', () => {
    appSettings.sub = settingDefaultSub.value;
    saveAppSettings();
    triggerHaptic();
  });

  settingDefaultVolume?.addEventListener('input', () => {
    appSettings.volume = parseInt(settingDefaultVolume.value, 10);
    valSettingVolume.textContent = appSettings.volume + '%';
    saveAppSettings();
  });

  settingDefaultBrightness?.addEventListener('input', () => {
    appSettings.brightness = parseInt(settingDefaultBrightness.value, 10);
    valSettingBrightness.textContent = appSettings.brightness + '%';
    saveAppSettings();
  });

  settingBackgroundPlay?.addEventListener('change', () => {
    appSettings.backgroundPlay = settingBackgroundPlay.checked;
    saveAppSettings();
    triggerHaptic();
    showOsd(appSettings.backgroundPlay ? 'Background Play: Enabled' : 'Background Play: Disabled');
  });

  settingResumeBehavior?.addEventListener('change', () => {
    appSettings.resumeBehavior = settingResumeBehavior.value;
    saveAppSettings();
    triggerHaptic();
  });

  loadAppSettings();

  // Native Android Helpers
  function triggerHaptic() {
    try {
      if (window.PVPNative && typeof window.PVPNative.triggerHaptic === 'function') {
        window.PVPNative.triggerHaptic();
      }
    } catch (_) {}
  }

  function keepScreenOn(enable) {
    try {
      if (window.PVPNative && typeof window.PVPNative.keepScreenOn === 'function') {
        window.PVPNative.keepScreenOn(enable);
      }
    } catch (_) {}
  }

  function setOrientation(landscape) {
    try {
      if (window.PVPNative && typeof window.PVPNative.setOrientation === 'function') {
        window.PVPNative.setOrientation(landscape);
      }
    } catch (_) {}
  }

  function setNativeFullscreen(enable) {
    try {
      if (window.PVPNative && typeof window.PVPNative.setFullscreen === 'function') {
        window.PVPNative.setFullscreen(enable);
      }
    } catch (_) {}
  }

  function shareUrl(url) {
    try {
      if (window.PVPNative && typeof window.PVPNative.shareUrl === 'function') {
        window.PVPNative.shareUrl(url);
      } else if (navigator.share) {
        navigator.share({ title: currentPlayingTitle || 'Video', url: url });
      }
    } catch (_) {}
  }

  // ==========================================
  // VIEW NAVIGATION & ANDROID BACK HANDLER
  // ==========================================
  function switchView(viewName) {
    if (viewName === 'player') {
      homeView.classList.remove('active-view');
      playerView.classList.add('active-view');
      activeView = 'player';
      keepScreenOn(true);
      setNativeFullscreen(true);
      showHud();
    } else {
      stopPlayback();
      playerView.classList.remove('active-view');
      homeView.classList.add('active-view');
      activeView = 'home';
      keepScreenOn(false);
      setNativeFullscreen(false);
      setOrientation(false);
      isLandscape = false;
      isFullscreen = false;
      renderHistory();
    }
  }

  window.handleAndroidBack = function() {
    // If resume modal is open, close it
    if (resumeModal && !resumeModal.classList.contains('hidden')) {
      closeResumeModal();
      triggerHaptic();
      return true;
    }
    // If a bottom sheet is open, close it first
    if (activeSheet) {
      closeActiveSheet();
      triggerHaptic();
      return true;
    }
    // If in player view, exit back to home view
    if (activeView === 'player') {
      switchView('home');
      triggerHaptic();
      return true;
    }
    // On home view, return false to allow Android to minimize/exit
    return false;
  };

  btnPlayerBack.addEventListener('click', () => {
    triggerHaptic();
    switchView('home');
  });

  btnPlayerErrorBack?.addEventListener('click', () => {
    triggerHaptic();
    switchView('home');
  });

  // ==========================================
  // INPUT CONTROLS & CLIPBOARD AUTO-DETECTION
  // ==========================================
  urlInput.addEventListener('input', () => {
    btnClearInput.classList.toggle('hidden', !urlInput.value);
    homeErrorMsg.classList.add('hidden');
  });

  btnClearInput.addEventListener('click', () => {
    urlInput.value = '';
    btnClearInput.classList.add('hidden');
    urlInput.focus();
    triggerHaptic();
  });

  btnPasteInput.addEventListener('click', async () => {
    triggerHaptic();
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        btnClearInput.classList.remove('hidden');
        homeErrorMsg.classList.add('hidden');
      }
    } catch (_) {
      urlInput.focus();
    }
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleStreamSubmit();
    }
  });

  btnStartStream.addEventListener('click', () => {
    triggerHaptic();
    handleStreamSubmit();
  });

  async function pasteAndPlay() {
    triggerHaptic();
    try {
      const text = await navigator.clipboard.readText();
      const cleanUrl = text ? text.trim() : '';
      if (!cleanUrl || (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://'))) {
        showHomeError('Clipboard does not contain a valid URL');
        return;
      }
      urlInput.value = cleanUrl;
      btnClearInput.classList.remove('hidden');
      if (clipboardBanner) clipboardBanner.classList.add('hidden');
      handleStreamSubmit();
    } catch (_) {
      showHomeError('Could not read clipboard. Please paste link manually.');
      urlInput.focus();
    }
  }

  btnHomePastePlay.addEventListener('click', pasteAndPlay);

  // BlackHole-style clipboard auto-detection
  let lastCheckedClip = '';
  let dismissedClip = '';

  async function checkClipboardForVideo() {
    if (activeView === 'player') return;
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) return;
      const text = (await navigator.clipboard.readText() || '').trim();
      if (!text || (!text.startsWith('http://') && !text.startsWith('https://'))) return;
      if (text === dismissedClip || text === lastCheckedClip) return;

      const isVideoLink = /(?:youtube\.com|youtu\.be|instagram\.com|tiktok\.com|twitter\.com|x\.com|twitch\.tv|vimeo\.com|dailymotion\.com|\.mp4|\.m3u8|\.mkv|\.mov|\.webm|\/video\/|\/reel\/)/i.test(text);
      if (isVideoLink) {
        lastCheckedClip = text;
        clipboardUrlText.textContent = text.length > 40 ? text.slice(0, 38) + '...' : text;
        clipboardBanner.classList.remove('hidden');
      }
    } catch (_) {}
  }

  btnClipboardPlay.addEventListener('click', () => {
    triggerHaptic();
    clipboardBanner.classList.add('hidden');
    if (lastCheckedClip) {
      urlInput.value = lastCheckedClip;
      btnClearInput.classList.remove('hidden');
      handleStreamSubmit();
    }
  });

  btnClipboardDismiss.addEventListener('click', () => {
    triggerHaptic();
    dismissedClip = lastCheckedClip;
    clipboardBanner.classList.add('hidden');
  });

  window.addEventListener('focus', () => {
    setTimeout(checkClipboardForVideo, 500);
  });

  function showHomeError(msg) {
    homeErrorMsg.textContent = msg;
    homeErrorMsg.classList.remove('hidden');
  }

  // ==========================================
  // ROBUST STREAM URL EXTRACTION
  // ==========================================
  function extractYouTubeId(url) {
    if (!url) return null;
    const str = url.trim();
    const shortMatch = str.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
    if (shortMatch) return shortMatch[1];
    const pathMatch = str.match(/(?:\/shorts\/|\/embed\/|\/v\/|\/live\/)([a-zA-Z0-9_-]{11})/i);
    if (pathMatch) return pathMatch[1];
    const queryMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
    if (queryMatch) return queryMatch[1];
    return null;
  }

  function resolveMediaClientSide(url, fallbackTitle) {
    if (!url) return null;
    const rawUrl = url.trim();

    // 1. YouTube (Supports watch, shorts, live, embed, youtu.be, mobile URLs)
    const ytId = extractYouTubeId(rawUrl);
    if (ytId) {
      const ytOrigin = (window.location.origin && !window.location.origin.startsWith('file:') && window.location.origin !== 'null')
        ? window.location.origin
        : 'https://appassets.androidplatform.net';
      return {
        success: true,
        title: fallbackTitle || 'YouTube Video',
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Embed)',
          type: 'embed',
          video_url: `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(ytOrigin)}&widget_referrer=${encodeURIComponent(ytOrigin)}&rel=0&playsinline=1`
        }],
        default_quality_index: 0
      };
    }

    // 2. Vimeo
    const vimeoMatch = rawUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
    if (vimeoMatch) {
      return {
        success: true,
        title: fallbackTitle || 'Vimeo Video',
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Embed)',
          type: 'embed',
          video_url: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
        }],
        default_quality_index: 0
      };
    }

    // 3. Dailymotion
    const dmMatch = rawUrl.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i);
    if (dmMatch) {
      return {
        success: true,
        title: fallbackTitle || 'Dailymotion Video',
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Embed)',
          type: 'embed',
          video_url: `https://www.dailymotion.com/embed/video/${dmMatch[1]}?autoplay=1`
        }],
        default_quality_index: 0
      };
    }

    // 4. Streamable
    const streamableMatch = rawUrl.match(/streamable\.com\/([a-zA-Z0-9]+)/i);
    if (streamableMatch) {
      return {
        success: true,
        title: fallbackTitle || 'Streamable Video',
        is_embed_fallback: true,
        qualities: [{
          label: 'Auto (Embed)',
          type: 'embed',
          video_url: `https://streamable.com/e/${streamableMatch[1]}?autoplay=1`
        }],
        default_quality_index: 0
      };
    }

    // 5. Direct Media / HLS Stream (.m3u8, .mp4, .webm, etc.)
    const isHls = /\.m3u8($|\?)/i.test(rawUrl);
    const isDirectExt = /\.(mp4|webm|mov|mkv|ogg|mp3|flv|avi)($|\?)/i.test(rawUrl);
    const isKnownMediaEndpoint = /googlevideo\.com\/videoplayback/i.test(rawUrl) || /\/video\//i.test(rawUrl);

    if (isHls || isDirectExt || isKnownMediaEndpoint) {
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

    // 6. Generic direct HTTP link check
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const cleanName = rawUrl.split('?')[0].split('/').pop() || 'Media Stream';
      return {
        success: true,
        title: fallbackTitle || decodeURIComponent(cleanName),
        qualities: [{
          label: 'Direct Stream',
          type: 'direct',
          video_url: rawUrl,
          is_hls: isHls
        }],
        default_quality_index: 0
      };
    }

    return null;
  }

  async function handleStreamSubmit(customUrl, startPosition) {
    const rawUrl = (customUrl || urlInput.value).trim();
    if (!rawUrl) {
      showHomeError('Please paste or enter a video URL');
      return;
    }

    homeErrorMsg.classList.add('hidden');
    setHomeLoading(true);

    try {
      let finalData = null;

      // 1. Only query local backend server if configured with a remote/LAN IP
      if (API_BASE && !API_BASE.includes('127.0.0.1') && !API_BASE.includes('localhost')) {
        try {
          const timeoutController = new AbortController();
          const timeoutId = setTimeout(() => timeoutController.abort(), 3000);
          const res = await fetch(API_BASE + '/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: rawUrl }),
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
      }

      // 2. Client-side fallback resolution
      if (!finalData) {
        finalData = resolveMediaClientSide(rawUrl);
      }

      if (!finalData) {
        throw new Error('Unsupported video link. Enter a direct stream (.mp4, .m3u8), YouTube, or Vimeo URL.');
      }

      currentPlayingUrl = rawUrl;
      currentPlayingTitle = finalData.title || 'Video Stream';

      // Record in history
      saveToHistory(rawUrl, currentPlayingTitle, startPosition || 0);

      switchView('player');
      loadMedia(finalData, startPosition);

    } catch (err) {
      showHomeError(err.message || 'Could not stream video. Please check the link.');
    } finally {
      setHomeLoading(false);
    }
  }

  function setHomeLoading(loading) {
    if (loading) {
      streamBtnText.textContent = 'Opening Stream...';
      homeSpinner.classList.remove('hidden');
      btnStartStream.style.opacity = '0.8';
      btnStartStream.disabled = true;
    } else {
      streamBtnText.textContent = 'Stream Video';
      homeSpinner.classList.add('hidden');
      btnStartStream.style.opacity = '1';
      btnStartStream.disabled = false;
    }
  }

  // ==========================================
  // PLAYBACK ENGINE WITH DEFAULT SETTINGS
  // ==========================================
  function loadMedia(data, resumeTime) {
    playerTitle.textContent = data.title || 'PVP Video Player';
    showPlayerLoader('Connecting media...');
    hidePlayerError();
    resetPlayerState();

    // Apply default screen brightness setting
    const defaultBright = (appSettings.brightness || 100) / 100;
    currentBrightness = defaultBright;
    playerCanvas.style.filter = `brightness(${currentBrightness})`;

    const quality = (data.qualities && data.qualities[0]) ? data.qualities[0] : null;

    if (!quality) {
      showPlayerError('Error: No playable stream found.');
      hidePlayerLoader();
      return;
    }

    if (quality.type === 'embed' || data.is_embed_fallback) {
      // Embed mode (YouTube, Vimeo, etc.)
      videoPlayer.classList.add('hidden');
      videoPlayer.pause();
      playerCanvas.classList.add('embed-active');
      embedFrame.src = quality.video_url;
      embedFrame.classList.remove('hidden');
      hidePlayerLoader();
      showOsd('Streaming in Embed Mode');
      return;
    }

    // Direct / HLS mode
    playerCanvas.classList.remove('embed-active');
    embedFrame.classList.add('hidden');
    embedFrame.src = '';
    videoPlayer.classList.remove('hidden');

    // Apply default playback speed setting
    const defaultSpeed = parseFloat(appSettings.speed || '1.0');
    currentPlaybackRate = defaultSpeed;
    videoPlayer.playbackRate = defaultSpeed;
    hudSpeedLabel.textContent = `${defaultSpeed}x`;

    // Apply default volume setting
    const defaultVol = Math.max(0, Math.min(1.0, (appSettings.volume || 100) / 100));
    videoPlayer.volume = defaultVol;
    videoPlayer.muted = false;

    const streamUrl = quality.video_url;
    const isHls = quality.is_hls || /\.m3u8($|\?)/i.test(streamUrl);

    if (isHls && window.Hls && Hls.isSupported()) {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(videoPlayer);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, (evt, manifest) => {
        setupHlsAudioAndSubs(manifest);

        // Apply default video quality preference
        if (appSettings.quality !== 'auto' && hlsInstance.levels && hlsInstance.levels.length > 0) {
          const targetHeight = parseInt(appSettings.quality, 10);
          let matchedIdx = -1;
          hlsInstance.levels.forEach((lvl, idx) => {
            if (lvl.height === targetHeight) matchedIdx = idx;
          });
          if (matchedIdx !== -1) {
            hlsInstance.currentLevel = matchedIdx;
          }
        }

        // Apply default audio language preference
        if (appSettings.audio !== 'default' && hlsInstance.audioTracks && hlsInstance.audioTracks.length > 0) {
          const pref = appSettings.audio.toLowerCase();
          hlsInstance.audioTracks.forEach((tr, idx) => {
            if ((tr.lang && tr.lang.toLowerCase().includes(pref)) || (tr.name && tr.name.toLowerCase().includes(pref))) {
              hlsInstance.audioTrack = idx;
              currentAudioTrack = idx;
            }
          });
        }

        // Apply default subtitle preference
        if (appSettings.sub === 'on' && hlsInstance.subtitleTracks && hlsInstance.subtitleTracks.length > 0) {
          hlsInstance.subtitleTrack = 0;
          currentSubTrack = 0;
        }

        hidePlayerLoader();

        // Resume position if specified
        if (resumeTime && resumeTime > 0) {
          videoPlayer.currentTime = resumeTime;
          showOsd(`Resumed at ${formatTime(resumeTime)}`);
        }

        videoPlayer.play().catch(() => {});
      });

      hlsInstance.on(Hls.Events.ERROR, (evt, errData) => {
        if (errData.fatal) {
          switch (errData.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hlsInstance.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hlsInstance.recoverMediaError();
              break;
            default:
              hlsInstance.destroy();
              showPlayerError('HLS stream failed to load.');
              break;
          }
        }
      });
    } else {
      // Native HTML5 Video playback
      videoPlayer.src = streamUrl;
      videoPlayer.load();

      if (resumeTime && resumeTime > 0) {
        videoPlayer.currentTime = resumeTime;
        showOsd(`Resumed at ${formatTime(resumeTime)}`);
      }

      videoPlayer.play().catch(() => {});
    }
  }

  function resetPlayerState() {
    playerCanvas.classList.remove('embed-active');
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
    progressBar.style.width = '0%';
    seekSlider.value = 0;
    timeElapsed.textContent = '00:00';
    timeTotal.textContent = '00:00';
    currentMediaDuration = 0;
    vlcSubtitleOverlay.textContent = '';
    vlcSubtitleOverlay.classList.add('hidden');
    hidePlayerError();
  }

  function stopPlayback() {
    // Save last played timestamp before stopping
    if (currentPlayingUrl && videoPlayer.currentTime > 5) {
      updateHistoryTimestamp(currentPlayingUrl, Math.floor(videoPlayer.currentTime), Math.floor(videoPlayer.duration || currentMediaDuration));
    }

    playerCanvas.classList.remove('embed-active');
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    embedFrame.src = '';
    embedFrame.classList.add('hidden');
    hidePlayerError();
  }

  function showPlayerError(msg) {
    playerErrorMsg.textContent = msg || 'The media format or stream URL could not be loaded.';
    playerErrorOverlay.classList.remove('hidden');
    hidePlayerLoader();
  }

  function hidePlayerError() {
    playerErrorOverlay.classList.add('hidden');
  }

  // Video Event Listeners
  videoPlayer.addEventListener('error', () => {
    hidePlayerLoader();
    const err = videoPlayer.error;
    let msg = 'The stream could not be loaded.';
    if (err) {
      if (err.code === 2) msg = 'Network error while loading video stream.';
      else if (err.code === 3) msg = 'Media decode error: format unsupported.';
      else if (err.code === 4) msg = 'Format not supported or stream unreachable.';
    }
    showPlayerError(msg);
  });

  videoPlayer.addEventListener('loadedmetadata', () => {
    currentMediaDuration = videoPlayer.duration || 0;
    timeTotal.textContent = formatTime(currentMediaDuration);
    hidePlayerLoader();
  });

  let lastSavedHistoryTime = 0;

  videoPlayer.addEventListener('timeupdate', () => {
    if (isSeeking) return;
    const cur = videoPlayer.currentTime || 0;
    const dur = videoPlayer.duration || currentMediaDuration || 0;

    timeElapsed.textContent = formatTime(cur);
    if (dur > 0) {
      const pct = (cur / dur) * 100;
      progressBar.style.width = `${pct}%`;
      seekSlider.value = pct;
      if (showRemainingTime) {
        const rem = dur - cur;
        timeTotal.textContent = '-' + formatTime(rem > 0 ? rem : 0);
      } else {
        timeTotal.textContent = formatTime(dur);
      }
    }

    // Buffer bar
    if (videoPlayer.buffered.length > 0 && dur > 0) {
      const bufEnd = videoPlayer.buffered.end(videoPlayer.buffered.length - 1);
      const bufPct = Math.min(100, (bufEnd / dur) * 100);
      bufferBar.style.width = `${bufPct}%`;
    }

    // Custom Subtitle Sync
    renderCustomSubtitles(cur);

    // Save playback position to history every 3 seconds
    const now = Date.now();
    if (now - lastSavedHistoryTime > 3000 && cur > 3) {
      lastSavedHistoryTime = now;
      updateHistoryTimestamp(currentPlayingUrl, Math.floor(cur), Math.floor(dur));
    }
  });

  videoPlayer.addEventListener('play', () => {
    updatePlayPauseButton(true);
    hidePlayerLoader();
    hidePlayerError();
  });

  videoPlayer.addEventListener('pause', () => {
    updatePlayPauseButton(false);
    if (currentPlayingUrl && videoPlayer.currentTime > 5) {
      updateHistoryTimestamp(currentPlayingUrl, Math.floor(videoPlayer.currentTime), Math.floor(videoPlayer.duration || currentMediaDuration));
    }
  });

  videoPlayer.addEventListener('waiting', () => {
    showPlayerLoader('Buffering...');
  });

  videoPlayer.addEventListener('playing', () => {
    hidePlayerLoader();
    hidePlayerError();
  });

  videoPlayer.addEventListener('ended', () => {
    updatePlayPauseButton(false);
    if (currentPlayingUrl) {
      updateHistoryTimestamp(currentPlayingUrl, 0, Math.floor(videoPlayer.duration || currentMediaDuration));
    }
  });

  function updatePlayPauseButton(isPlaying) {
    if (isPlaying) {
      hudPlaySvg.classList.add('hidden');
      hudPauseSvg.classList.remove('hidden');
    } else {
      hudPlaySvg.classList.remove('hidden');
      hudPauseSvg.classList.add('hidden');
    }
  }

  function togglePlayPause() {
    triggerHaptic();
    if (videoPlayer.paused) {
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }

  btnHudPlayPause.addEventListener('click', togglePlayPause);

  // Scrubber / Seek
  seekSlider.addEventListener('input', () => {
    isSeeking = true;
    const dur = videoPlayer.duration || currentMediaDuration || 0;
    if (dur > 0) {
      const seekSec = (parseFloat(seekSlider.value) / 100) * dur;
      progressBar.style.width = `${seekSlider.value}%`;
      timeElapsed.textContent = formatTime(seekSec);
    }
  });

  seekSlider.addEventListener('change', () => {
    const dur = videoPlayer.duration || currentMediaDuration || 0;
    if (dur > 0) {
      videoPlayer.currentTime = (parseFloat(seekSlider.value) / 100) * dur;
    }
    isSeeking = false;
    triggerHaptic();
  });

  // Time toggle
  timeTotal.addEventListener('click', () => {
    triggerHaptic();
    showRemainingTime = !showRemainingTime;
    const cur = videoPlayer.currentTime || 0;
    const dur = videoPlayer.duration || currentMediaDuration || 0;
    if (dur > 0) {
      timeTotal.textContent = showRemainingTime ? '-' + formatTime(Math.max(0, dur - cur)) : formatTime(dur);
    }
  });

  // Relative Seek (±10s)
  function seekRelative(seconds) {
    triggerHaptic();
    const dur = videoPlayer.duration || currentMediaDuration || 0;
    const target = Math.max(0, Math.min(dur || 999999, videoPlayer.currentTime + seconds));
    videoPlayer.currentTime = target;
  }

  btnHudRewind.addEventListener('click', () => seekRelative(-10));
  btnHudForward.addEventListener('click', () => seekRelative(10));

  // Audio Mute Toggle
  btnHudMute.addEventListener('click', () => {
    triggerHaptic();
    videoPlayer.muted = !videoPlayer.muted;
    if (videoPlayer.muted) {
      volHighSvg.classList.add('hidden');
      volMuteSvg.classList.remove('hidden');
      showOsd('Muted');
    } else {
      volHighSvg.classList.remove('hidden');
      volMuteSvg.classList.add('hidden');
      showOsd('Unmuted');
    }
  });

  // Share
  btnHudShare.addEventListener('click', () => {
    triggerHaptic();
    if (currentPlayingUrl) {
      shareUrl(currentPlayingUrl);
    }
  });

  // Fullscreen & Orientation
  btnHudRotate.addEventListener('click', () => {
    triggerHaptic();
    isLandscape = !isLandscape;
    setOrientation(isLandscape);
    showOsd(isLandscape ? 'Landscape Mode' : 'Portrait Mode');
  });

  btnHudFullscreen.addEventListener('click', () => {
    triggerHaptic();
    isFullscreen = !isFullscreen;
    setNativeFullscreen(isFullscreen);
  });

  // ==========================================
  // TOUCH GESTURES (SWIPE VOLUME, BRIGHTNESS & DOUBLE TAP)
  // ==========================================
  let lastTapLeftTime = 0;
  let lastTapRightTime = 0;
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartVal = 0;
  let isSwiping = false;
  let swipeTarget = null;

  playerGestureZone.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
    isSwiping = false;

    const screenWidth = window.innerWidth;
    swipeTarget = touch.clientX < screenWidth / 2 ? 'brightness' : 'volume';
    touchStartVal = swipeTarget === 'brightness' ? currentBrightness : videoPlayer.volume;
  }, { passive: true });

  playerGestureZone.addEventListener('touchmove', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaY = touchStartY - touch.clientY;
    const deltaX = Math.abs(touch.clientX - touchStartX);

    if (Math.abs(deltaY) > 20 && Math.abs(deltaY) > deltaX) {
      isSwiping = true;
      const change = deltaY / 300;

      if (swipeTarget === 'brightness') {
        currentBrightness = Math.max(0.15, Math.min(1.0, touchStartVal + change));
        playerCanvas.style.filter = `brightness(${currentBrightness})`;
        brightnessHudVal.textContent = Math.round(currentBrightness * 100) + '%';
        showGestureHud(brightnessHud);
      } else {
        const newVol = Math.max(0, Math.min(1.0, touchStartVal + change));
        videoPlayer.volume = newVol;
        videoPlayer.muted = false;
        volHighSvg.classList.remove('hidden');
        volMuteSvg.classList.add('hidden');
        volumeHudVal.textContent = Math.round(newVol * 100) + '%';
        showGestureHud(volumeHud);
      }
    }
  }, { passive: true });

  playerGestureZone.addEventListener('touchend', (e) => {
    if (!isSwiping) {
      const touchX = e.changedTouches[0].clientX;
      const screenWidth = window.innerWidth;
      const now = Date.now();

      if (touchX < screenWidth * 0.35) {
        if (now - lastTapLeftTime < 320) {
          seekRelative(-10);
          showRipple(rippleLeft);
          lastTapLeftTime = 0;
          return;
        }
        lastTapLeftTime = now;
      } else if (touchX > screenWidth * 0.65) {
        if (now - lastTapRightTime < 320) {
          seekRelative(10);
          showRipple(rippleRight);
          lastTapRightTime = 0;
          return;
        }
        lastTapRightTime = now;
      }

      toggleHud();
    }
  });

  function showRipple(rippleEl) {
    rippleEl.classList.remove('active');
    void rippleEl.offsetWidth;
    rippleEl.classList.add('active');
    setTimeout(() => rippleEl.classList.remove('active'), 500);
  }

  function showGestureHud(hudEl) {
    clearTimeout(hudIndicatorTimer);
    volumeHud.classList.add('hidden');
    brightnessHud.classList.add('hidden');
    hudEl.classList.remove('hidden');
    hudIndicatorTimer = setTimeout(() => {
      hudEl.classList.add('hidden');
    }, 1200);
  }

  // ==========================================
  // HUD VISIBILITY & AUTO-HIDE
  // ==========================================
  function showHud() {
    clearTimeout(hudHideTimer);
    playerHud.classList.remove('hud-hidden');
    if (!videoPlayer.paused) {
      hudHideTimer = setTimeout(() => {
        playerHud.classList.add('hud-hidden');
      }, 3500);
    }
  }

  function toggleHud() {
    if (playerHud.classList.contains('hud-hidden')) {
      showHud();
    } else {
      playerHud.classList.add('hud-hidden');
    }
  }

  playerHud.addEventListener('click', () => {
    showHud();
  });

  // Loader & OSD
  function showPlayerLoader(msg) {
    playerLoaderMsg.textContent = msg || 'Loading...';
    playerLoader.classList.remove('hidden');
  }

  function hidePlayerLoader() {
    playerLoader.classList.add('hidden');
  }

  function showOsd(msg) {
    clearTimeout(osdTimer);
    vlcOsd.textContent = msg;
    vlcOsd.classList.remove('hidden');
    osdTimer = setTimeout(() => {
      vlcOsd.classList.add('hidden');
    }, 2200);
  }

  // ==========================================
  // MATERIAL 3 MODAL BOTTOM SHEETS
  // ==========================================
  function openSheet(sheetEl) {
    triggerHaptic();
    closeActiveSheet();
    sheetBackdrop.classList.remove('hidden');
    sheetEl.classList.remove('hidden');
    activeSheet = sheetEl;
  }

  function closeActiveSheet() {
    if (activeSheet) {
      activeSheet.classList.add('hidden');
      activeSheet = null;
    }
    sheetBackdrop.classList.add('hidden');
  }

  sheetBackdrop.addEventListener('click', closeActiveSheet);
  document.querySelectorAll('.sheet-close-btn').forEach(btn => {
    btn.addEventListener('click', closeActiveSheet);
  });

  // 1. Audio Track Sheet
  btnAudioSheet.addEventListener('click', () => {
    openSheet(audioSheet);
  });

  function setupHlsAudioAndSubs(manifest) {
    audioTracksList.innerHTML = '';
    const defItem = document.createElement('div');
    defItem.className = `sheet-list-item ${currentAudioTrack === -1 ? 'active' : ''}`;
    defItem.innerHTML = `<span class="sheet-item-label">Default Audio Track</span><span class="sheet-item-check">${currentAudioTrack === -1 ? '✓' : ''}</span>`;
    defItem.addEventListener('click', () => {
      if (hlsInstance) hlsInstance.audioTrack = -1;
      currentAudioTrack = -1;
      closeActiveSheet();
      showOsd('Audio: Default');
      triggerHaptic();
    });
    audioTracksList.appendChild(defItem);

    if (hlsInstance && hlsInstance.audioTracks && hlsInstance.audioTracks.length > 0) {
      hlsInstance.audioTracks.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = `sheet-list-item ${currentAudioTrack === idx ? 'active' : ''}`;
        const name = track.name || track.lang || `Track ${idx + 1}`;
        item.innerHTML = `<span class="sheet-item-label">${name}</span><span class="sheet-item-check">${currentAudioTrack === idx ? '✓' : ''}</span>`;
        item.addEventListener('click', () => {
          hlsInstance.audioTrack = idx;
          currentAudioTrack = idx;
          closeActiveSheet();
          showOsd(`Audio: ${name}`);
          triggerHaptic();
        });
        audioTracksList.appendChild(item);
      });
    }

    subtitleTracksList.innerHTML = '';
    const offItem = document.createElement('div');
    offItem.className = `sheet-list-item ${currentSubTrack === -1 ? 'active' : ''}`;
    offItem.innerHTML = `<span class="sheet-item-label">Subtitles Off</span><span class="sheet-item-check">${currentSubTrack === -1 ? '✓' : ''}</span>`;
    offItem.addEventListener('click', () => {
      if (hlsInstance) hlsInstance.subtitleTrack = -1;
      currentSubTrack = -1;
      vlcSubtitleOverlay.textContent = '';
      vlcSubtitleOverlay.classList.add('hidden');
      closeActiveSheet();
      showOsd('Subtitles Off');
      triggerHaptic();
    });
    subtitleTracksList.appendChild(offItem);

    if (hlsInstance && hlsInstance.subtitleTracks && hlsInstance.subtitleTracks.length > 0) {
      hlsInstance.subtitleTracks.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = `sheet-list-item ${currentSubTrack === idx ? 'active' : ''}`;
        const name = track.name || track.lang || `Subtitle ${idx + 1}`;
        item.innerHTML = `<span class="sheet-item-label">${name}</span><span class="sheet-item-check">${currentSubTrack === idx ? '✓' : ''}</span>`;
        item.addEventListener('click', () => {
          hlsInstance.subtitleTrack = idx;
          currentSubTrack = idx;
          closeActiveSheet();
          showOsd(`Subtitle: ${name}`);
          triggerHaptic();
        });
        subtitleTracksList.appendChild(item);
      });
    }
  }

  // 2. Subtitle Sheet
  btnSubSheet.addEventListener('click', () => {
    openSheet(subtitleSheet);
  });

  btnLoadCustomSub.addEventListener('click', () => {
    triggerHaptic();
    subFileInput.click();
  });

  subFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      parseCustomSubtitles(evt.target.result);
      customSubLabel.textContent = file.name;
      closeActiveSheet();
      showOsd(`Loaded Subtitle: ${file.name}`);
      triggerHaptic();
    };
    reader.readAsText(file);
  });

  function parseCustomSubtitles(text) {
    customSubtitles = [];
    const blocks = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n\n+/);
    blocks.forEach(block => {
      const lines = block.trim().split('\n');
      if (lines.length >= 2) {
        let timeLine = lines[0].includes('-->') ? lines[0] : (lines[1].includes('-->') ? lines[1] : null);
        let textLines = lines.slice(lines.indexOf(timeLine) + 1);
        if (timeLine) {
          const parts = timeLine.split('-->');
          const start = parseTimestamp(parts[0].trim());
          const end = parseTimestamp(parts[1].trim());
          if (start !== null && end !== null) {
            customSubtitles.push({ start, end, text: textLines.join('\n') });
          }
        }
      }
    });
  }

  function parseTimestamp(str) {
    const match = /(?:(\d+):)?(\d+):(\d+)(?:[.,](\d+))?/.exec(str);
    if (!match) return null;
    const hours = parseInt(match[1] || '0', 10);
    const mins = parseInt(match[2], 10);
    const secs = parseInt(match[3], 10);
    const ms = parseInt(match[4] || '0', 10);
    return hours * 3600 + mins * 60 + secs + ms / 1000;
  }

  function renderCustomSubtitles(currentTime) {
    if (customSubtitles.length === 0) return;
    const adjustedTime = currentTime + (subtitleDelayMs / 1000);
    const active = customSubtitles.find(s => adjustedTime >= s.start && adjustedTime <= s.end);
    if (active) {
      vlcSubtitleOverlay.textContent = active.text;
      vlcSubtitleOverlay.classList.remove('hidden');
    } else {
      vlcSubtitleOverlay.textContent = '';
      vlcSubtitleOverlay.classList.add('hidden');
    }
  }

  btnSubDelayMinus.addEventListener('click', () => {
    subtitleDelayMs -= 50;
    subDelayDisplay.textContent = `${subtitleDelayMs} ms`;
    triggerHaptic();
  });

  btnSubDelayPlus.addEventListener('click', () => {
    subtitleDelayMs += 50;
    subDelayDisplay.textContent = `${subtitleDelayMs} ms`;
    triggerHaptic();
  });

  btnSubDelayReset.addEventListener('click', () => {
    subtitleDelayMs = 0;
    subDelayDisplay.textContent = '0 ms';
    triggerHaptic();
  });

  subSizeSelect.addEventListener('change', () => {
    vlcSubtitleOverlay.style.fontSize = subSizeSelect.value;
  });

  subColorSelect.addEventListener('change', () => {
    vlcSubtitleOverlay.style.color = subColorSelect.value;
  });

  // 3. Playback Speed Sheet
  btnSpeedSheet.addEventListener('click', () => {
    openSheet(speedSheet);
  });

  speedChips.forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic();
      const speed = parseFloat(chip.dataset.speed);
      currentPlaybackRate = speed;
      videoPlayer.playbackRate = speed;
      hudSpeedLabel.textContent = `${speed}x`;
      speedChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      closeActiveSheet();
      showOsd(`Speed: ${speed}x`);
    });
  });

  // 4. Settings Sheet
  btnOpenSettings.addEventListener('click', () => {
    openSheet(settingsSheet);
    if (localServerInput) {
      localServerInput.value = localStorage.getItem('pvp_local_server_url') || '';
    }
  });

  btnSaveServer.addEventListener('click', () => {
    triggerHaptic();
    const val = (localServerInput.value || '').trim().replace(/\/+$/, '');
    if (val) {
      localStorage.setItem('pvp_local_server_url', val);
      API_BASE = val;
    } else {
      localStorage.removeItem('pvp_local_server_url');
      API_BASE = '';
    }
    closeActiveSheet();
    showOsd('Server settings saved');
  });

  btnResetServer.addEventListener('click', () => {
    triggerHaptic();
    localStorage.removeItem('pvp_local_server_url');
    API_BASE = '';
    localServerInput.value = '';
    showOsd('Reset server to standalone');
  });

  // 5. Full History Sheet
  btnShowAllHistory?.addEventListener('click', () => {
    triggerHaptic();
    openSheet(historySheet);
    renderFullHistoryList();
  });

  btnClearAllHistory?.addEventListener('click', () => {
    triggerHaptic();
    localStorage.removeItem('pvp_mobile_history');
    renderHistory();
    renderFullHistoryList();
    closeActiveSheet();
    showOsd('History cleared');
  });

  // ==========================================
  // PLAYBACK HISTORY MANAGEMENT & RESUME
  // ==========================================
  function saveToHistory(url, title, timestamp) {
    try {
      let history = JSON.parse(localStorage.getItem('pvp_mobile_history') || '[]');
      const existing = history.find(item => item.url === url);
      history = history.filter(item => item.url !== url);
      history.unshift({
        url: url,
        title: title || 'Streamed Video',
        timestamp: Date.now(),
        lastTimestamp: timestamp !== undefined ? timestamp : (existing ? existing.lastTimestamp : 0),
        duration: existing ? existing.duration : 0
      });
      if (history.length > 30) history = history.slice(0, 30);
      localStorage.setItem('pvp_mobile_history', JSON.stringify(history));
    } catch (_) {}
  }

  function updateHistoryTimestamp(url, currentTime, duration) {
    try {
      let history = JSON.parse(localStorage.getItem('pvp_mobile_history') || '[]');
      const item = history.find(i => i.url === url);
      if (item) {
        item.lastTimestamp = Math.floor(currentTime);
        if (duration > 0) item.duration = Math.floor(duration);
        localStorage.setItem('pvp_mobile_history', JSON.stringify(history));
      }
    } catch (_) {}
  }

  function renderHistory() {
    try {
      const history = JSON.parse(localStorage.getItem('pvp_mobile_history') || '[]');
      if (!history || history.length === 0) {
        historyList.innerHTML = `
          <div class="history-empty">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <p>No recent streams yet</p>
            <span>Played videos will appear here for fast re-streaming</span>
          </div>`;
        btnShowAllHistory?.classList.add('hidden');
        return;
      }

      // Show up to 3 recent items at the bottom of the home screen
      const previewItems = history.slice(0, 3);
      historyList.innerHTML = '';
      previewItems.forEach(item => {
        const row = createHistoryRowElement(item);
        historyList.appendChild(row);
      });

      // Show more history button if history has items
      if (btnShowAllHistory) {
        btnShowAllHistory.textContent = `Show more history (${history.length} items)`;
        btnShowAllHistory.classList.remove('hidden');
      }
    } catch (_) {}
  }

  function renderFullHistoryList() {
    try {
      const history = JSON.parse(localStorage.getItem('pvp_mobile_history') || '[]');
      if (historyTotalCount) {
        historyTotalCount.textContent = `${history.length} video${history.length === 1 ? '' : 's'}`;
      }
      if (!history || history.length === 0) {
        fullHistoryList.innerHTML = `
          <div class="history-empty">
            <p>History is empty</p>
          </div>`;
        return;
      }
      fullHistoryList.innerHTML = '';
      history.forEach((item, index) => {
        const row = createHistoryRowElement(item, true, index);
        fullHistoryList.appendChild(row);
      });
    } catch (_) {}
  }

  function createHistoryRowElement(item, isFullList, index) {
    const row = document.createElement('div');
    row.className = 'history-item';

    const lastTime = item.lastTimestamp || 0;
    const dur = item.duration || 0;
    let progressBadge = '';
    if (lastTime > 5 && dur > 0) {
      progressBadge = `<span style="color:#ffaa00; margin-left: 6px;">▶ ${formatTime(lastTime)} / ${formatTime(dur)}</span>`;
    } else if (lastTime > 5) {
      progressBadge = `<span style="color:#ffaa00; margin-left: 6px;">▶ ${formatTime(lastTime)}</span>`;
    }

    row.innerHTML = `
      <div class="history-icon-box">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </div>
      <div class="history-details">
        <span class="history-title">${escapeHtml(item.title)}</span>
        <span class="history-meta">${formatRelativeTime(item.timestamp)} ${progressBadge}</span>
      </div>
      ${isFullList ? `<button class="history-item-del-btn" title="Delete from history">&times;</button>` : `
      <div class="history-play-btn">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </div>`}`;

    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('history-item-del-btn')) {
        e.stopPropagation();
        deleteHistoryItem(item.url);
        return;
      }
      triggerHaptic();
      onRecentItemClicked(item);
    });

    return row;
  }

  function deleteHistoryItem(url) {
    try {
      let history = JSON.parse(localStorage.getItem('pvp_mobile_history') || '[]');
      history = history.filter(item => item.url !== url);
      localStorage.setItem('pvp_mobile_history', JSON.stringify(history));
      renderHistory();
      renderFullHistoryList();
    } catch (_) {}
  }

  // Handle clicking a recent video: Respect user setting (last / start / ask)
  function onRecentItemClicked(item) {
    const resumeMode = appSettings.resumeBehavior || 'last';
    const lastTime = item.lastTimestamp || 0;

    if (resumeMode === 'ask' && lastTime > 5) {
      // Show Resume Decision Modal
      pendingResumeItem = item;
      resumeVideoTitle.textContent = item.title;
      resumeTimeLabel.textContent = formatTime(lastTime);
      resumeModal.classList.remove('hidden');
      return;
    }

    if (resumeMode === 'last' && lastTime > 5) {
      // Resume from last timestamp
      closeActiveSheet();
      urlInput.value = item.url;
      btnClearInput.classList.remove('hidden');
      handleStreamSubmit(item.url, lastTime);
    } else {
      // Start from beginning (00:00)
      closeActiveSheet();
      urlInput.value = item.url;
      btnClearInput.classList.remove('hidden');
      handleStreamSubmit(item.url, 0);
    }
  }

  // Resume Modal buttons
  btnResumeLast?.addEventListener('click', () => {
    triggerHaptic();
    if (pendingResumeItem) {
      const item = pendingResumeItem;
      closeResumeModal();
      closeActiveSheet();
      urlInput.value = item.url;
      btnClearInput.classList.remove('hidden');
      handleStreamSubmit(item.url, item.lastTimestamp || 0);
    }
  });

  btnResumeStart?.addEventListener('click', () => {
    triggerHaptic();
    if (pendingResumeItem) {
      const item = pendingResumeItem;
      closeResumeModal();
      closeActiveSheet();
      urlInput.value = item.url;
      btnClearInput.classList.remove('hidden');
      handleStreamSubmit(item.url, 0);
    }
  });

  btnResumeCancel?.addEventListener('click', () => {
    triggerHaptic();
    closeResumeModal();
  });

  function closeResumeModal() {
    resumeModal.classList.add('hidden');
    pendingResumeItem = null;
  }

  // ==========================================
  // UTILITIES & GLOBAL EXPORTS
  // ==========================================
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    const s = Math.floor(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }

  function formatRelativeTime(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
  }

  // Global window functions for native Android Intent share and deep links
  window.playVideoUrl = function(url) {
    if (!url) return;
    urlInput.value = url.trim();
    btnClearInput.classList.remove('hidden');
    handleStreamSubmit();
  };

  window.handleStreamSubmit = function(url) {
    if (url) {
      urlInput.value = url.trim();
      btnClearInput.classList.remove('hidden');
    }
    handleStreamSubmit();
  };

  // Initial load
  renderHistory();
  setTimeout(checkClipboardForVideo, 600);

  // Check URL query parameters (e.g. ?url=...)
  const urlParams = new URLSearchParams(window.location.search);
  const autoUrl = urlParams.get('url');
  if (autoUrl) {
    window.playVideoUrl(autoUrl);
  }

  // Notify native Android that web app is fully ready
  if (typeof window.PVPNative !== 'undefined' && typeof window.PVPNative.onAppReady === 'function') {
    try {
      window.PVPNative.onAppReady();
    } catch (_) {}
  }
});
