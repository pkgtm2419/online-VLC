/**
 * PVP Chrome Extension - Standalone In-Browser VLC Player
 * Runs 100% locally inside the browser extension. Zero external server required.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const videoPlayer = document.getElementById('videoPlayer');
  const embedFrame = document.getElementById('embedFrame');
  const coneScreen = document.getElementById('coneScreen');
  const videoTitle = document.getElementById('videoTitle');
  const vlcOsd = document.getElementById('vlcOsd');

  // Controls
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnStop = document.getElementById('btnStop');
  const btnRewind10 = document.getElementById('btnRewind10');
  const btnForward10 = document.getElementById('btnForward10');
  const btnMute = document.getElementById('btnMute');
  const volSlider = document.getElementById('volSlider');
  const volText = document.getElementById('volText');
  const timelineSlider = document.getElementById('timelineSlider');
  const currentTime = document.getElementById('currentTime');
  const totalTime = document.getElementById('totalTime');
  const btnSlower = document.getElementById('btnSlower');
  const btnFaster = document.getElementById('btnFaster');
  const speedDisplay = document.getElementById('speedDisplay');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // Modals & Header Buttons
  const btnOpenStream = document.getElementById('btnOpenStream');
  const btnPastePlay = document.getElementById('btnPastePlay');
  const btnQuickOpen = document.getElementById('btnQuickOpen');
  const btnQuickPastePlay = document.getElementById('btnQuickPastePlay');
  const urlModal = document.getElementById('urlModal');
  const urlInput = document.getElementById('urlInput');
  const btnModalClose = document.getElementById('btnModalClose');
  const btnModalCancel = document.getElementById('btnModalCancel');
  const btnModalSubmit = document.getElementById('btnModalSubmit');

  let hlsInstance = null;
  let isSeeking = false;
  let osdTimeout = null;
  let currentSpeed = 1.0;

  function showOsd(msg) {
    if (!vlcOsd) return;
    vlcOsd.textContent = msg;
    vlcOsd.classList.add('show');
    clearTimeout(osdTimeout);
    osdTimeout = setTimeout(() => {
      vlcOsd.classList.remove('show');
    }, 2000);
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00:00';
    const s = Math.floor(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function stopPlayback() {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
    videoPlayer.pause();
    videoPlayer.src = '';
    videoPlayer.classList.add('hidden');
    embedFrame.src = '';
    embedFrame.classList.add('hidden');
    coneScreen.classList.remove('hidden');
    videoTitle.textContent = 'Personal Video Player';
    document.title = 'PVP Player';
    currentTime.textContent = '00:00:00';
    totalTime.textContent = '00:00:00';
    timelineSlider.value = 0;
    btnPlayPause.textContent = '▶';
  }

  function playStreamUrl(url) {
    if (!url) return;
    const cleanUrl = url.trim();

    stopPlayback();
    coneScreen.classList.add('hidden');

    // 1. YouTube
    const ytMatch = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/.exec(cleanUrl);
    if (ytMatch) {
      const ytId = ytMatch[1];
      embedFrame.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
      embedFrame.classList.remove('hidden');
      videoTitle.textContent = `YouTube: ${ytId} - PVP`;
      document.title = `YouTube: ${ytId} - PVP Player`;
      showOsd('Streaming YouTube Video');
      return;
    }

    // 2. Vimeo
    const vimeoMatch = /vimeo\.com\/(?:video\/)?([0-9]+)/.exec(cleanUrl);
    if (vimeoMatch) {
      embedFrame.src = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
      embedFrame.classList.remove('hidden');
      videoTitle.textContent = `Vimeo: ${vimeoMatch[1]} - PVP`;
      document.title = `Vimeo Video - PVP Player`;
      showOsd('Streaming Vimeo Video');
      return;
    }

    // 3. Direct HTML5 / HLS Stream
    videoPlayer.classList.remove('hidden');
    const isHls = /\.m3u8($|\?)/i.test(cleanUrl);
    const fileName = cleanUrl.split('?')[0].split('/').pop() || 'Media Stream';
    videoTitle.textContent = decodeURIComponent(fileName) + ' - PVP';
    document.title = decodeURIComponent(fileName) + ' - PVP Player';

    if (isHls && window.Hls && Hls.isSupported()) {
      hlsInstance = new Hls({ enableWorker: true });
      hlsInstance.loadSource(cleanUrl);
      hlsInstance.attachMedia(videoPlayer);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        videoPlayer.play().catch(() => {});
        btnPlayPause.textContent = '⏸';
        showOsd('HLS Stream Connected');
      });
      hlsInstance.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          showOsd('HLS Stream Error');
        }
      });
    } else {
      videoPlayer.src = cleanUrl;
      videoPlayer.play().catch(() => {});
      btnPlayPause.textContent = '⏸';
      showOsd('Playing Direct Video');
    }
  }

  // Play/Pause
  btnPlayPause.addEventListener('click', () => {
    if (videoPlayer.paused) {
      videoPlayer.play().then(() => {
        btnPlayPause.textContent = '⏸';
        showOsd('Play');
      }).catch(() => {});
    } else {
      videoPlayer.pause();
      btnPlayPause.textContent = '▶';
      showOsd('Pause');
    }
  });

  // Stop
  btnStop.addEventListener('click', () => {
    stopPlayback();
    showOsd('Stop');
  });

  // 10s Seek
  btnRewind10.addEventListener('click', () => {
    videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 10);
    showOsd('-10s');
  });

  btnForward10.addEventListener('click', () => {
    videoPlayer.currentTime = Math.min(videoPlayer.duration || 0, videoPlayer.currentTime + 10);
    showOsd('+10s');
  });

  // Timeline updates
  videoPlayer.addEventListener('timeupdate', () => {
    if (!isSeeking && videoPlayer.duration) {
      const pct = (videoPlayer.currentTime / videoPlayer.duration) * 100;
      timelineSlider.value = pct;
      currentTime.textContent = formatTime(videoPlayer.currentTime);
      totalTime.textContent = formatTime(videoPlayer.duration);
    }
  });

  timelineSlider.addEventListener('input', () => {
    isSeeking = true;
    if (videoPlayer.duration) {
      const targetTime = (timelineSlider.value / 100) * videoPlayer.duration;
      currentTime.textContent = formatTime(targetTime);
    }
  });

  timelineSlider.addEventListener('change', () => {
    if (videoPlayer.duration) {
      videoPlayer.currentTime = (timelineSlider.value / 100) * videoPlayer.duration;
    }
    isSeeking = false;
  });

  // Volume & Boost (up to 125%)
  volSlider.addEventListener('input', () => {
    const val = parseInt(volSlider.value, 10);
    volText.textContent = `${val}%`;
    videoPlayer.volume = Math.min(1.0, val / 100);
    if (val === 0) {
      btnMute.textContent = '🔇';
    } else if (val > 100) {
      btnMute.textContent = '📢';
    } else {
      btnMute.textContent = '🔊';
    }
    showOsd(`Volume: ${val}%`);
  });

  btnMute.addEventListener('click', () => {
    videoPlayer.muted = !videoPlayer.muted;
    btnMute.textContent = videoPlayer.muted ? '🔇' : '🔊';
    showOsd(videoPlayer.muted ? 'Muted' : 'Unmuted');
  });

  // Playback Speed
  btnSlower.addEventListener('click', () => {
    currentSpeed = Math.max(0.25, parseFloat((currentSpeed - 0.25).toFixed(2)));
    videoPlayer.playbackRate = currentSpeed;
    speedDisplay.textContent = `${currentSpeed.toFixed(2)}x`;
    showOsd(`Speed: ${currentSpeed.toFixed(2)}x`);
  });

  btnFaster.addEventListener('click', () => {
    currentSpeed = Math.min(3.0, parseFloat((currentSpeed + 0.25).toFixed(2)));
    videoPlayer.playbackRate = currentSpeed;
    speedDisplay.textContent = `${currentSpeed.toFixed(2)}x`;
    showOsd(`Speed: ${currentSpeed.toFixed(2)}x`);
  });

  // Fullscreen
  btnFullscreen.addEventListener('click', () => {
    const vlcWindow = document.getElementById('vlcWindow');
    if (!document.fullscreenElement) {
      vlcWindow.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Modal open / close
  function openModal() {
    urlModal.classList.remove('hidden');
    urlInput.focus();
    urlInput.select();
  }

  function closeModal() {
    urlModal.classList.add('hidden');
  }

  btnOpenStream.addEventListener('click', openModal);
  btnQuickOpen.addEventListener('click', openModal);
  btnModalClose.addEventListener('click', closeModal);
  btnModalCancel.addEventListener('click', closeModal);

  btnModalSubmit.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url) {
      closeModal();
      playStreamUrl(url);
    }
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnModalSubmit.click();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });

  // One-Tap Paste & Play
  async function pasteAndPlay() {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().startsWith('http')) {
        playStreamUrl(text.trim());
      } else {
        openModal();
      }
    } catch (_) {
      openModal();
    }
  }

  btnPastePlay.addEventListener('click', pasteAndPlay);
  btnQuickPastePlay.addEventListener('click', pasteAndPlay);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.code === 'Space') {
      e.preventDefault();
      btnPlayPause.click();
    } else if (e.key === 's' || e.key === 'S') {
      btnStop.click();
    } else if (e.key === 'f' || e.key === 'F') {
      btnFullscreen.click();
    } else if (e.key === 'm' || e.key === 'M') {
      btnMute.click();
    } else if (e.key === 'ArrowLeft') {
      btnRewind10.click();
    } else if (e.key === 'ArrowRight') {
      btnForward10.click();
    } else if (e.key === '[' ) {
      btnSlower.click();
    } else if (e.key === ']') {
      btnFaster.click();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
      e.preventDefault();
      openModal();
    }
  });

  // Check URL parameter (?url=...) on startup
  const params = new URLSearchParams(window.location.search);
  const targetUrl = params.get('url');
  if (targetUrl) {
    playStreamUrl(targetUrl);
  }
});
