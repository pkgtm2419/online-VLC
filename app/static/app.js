/**
 * Online VLC - Clean Ad-Free Video Player
 * Handles extraction, guaranteed autoplay, speed control, and multi-format playback.
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlInput = document.getElementById('urlInput');
  const btnPaste = document.getElementById('btnPaste');
  const btnPlay = document.getElementById('btnPlay');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');

  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  const btnDismissError = document.getElementById('btnDismissError');

  const placeholder = document.getElementById('placeholder');
  const videoPlayer = document.getElementById('videoPlayer');
  const videoLoader = document.getElementById('videoLoader');
  const loaderText = document.getElementById('loaderText');

  const videoMeta = document.getElementById('videoMeta');
  const videoTitle = document.getElementById('videoTitle');
  const speedSelect = document.getElementById('speedSelect');
  const qualitySelect = document.getElementById('qualitySelect');

  const unmutePrompt = document.getElementById('unmutePrompt');
  const btnUnmute = document.getElementById('btnUnmute');

  let currentVideoData = null;
  let currentQualities = [];
  let hlsInstance = null;

  // Paste button
  btnPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        handleExtract();
      }
    } catch {
      urlInput.focus();
    }
  });

  // Enter key in input
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExtract();
    }
  });

  btnPlay.addEventListener('click', handleExtract);
  btnDismissError.addEventListener('click', hideError);

  // Speed Control
  speedSelect.addEventListener('change', () => {
    videoPlayer.playbackRate = parseFloat(speedSelect.value);
  });

  // Unmute banner button
  btnUnmute.addEventListener('click', () => {
    videoPlayer.muted = false;
    unmutePrompt.classList.add('hidden');
  });

  // Clicking anywhere on video or container unmutes if muted by autoplay policy
  videoPlayer.addEventListener('click', () => {
    if (videoPlayer.muted && !unmutePrompt.classList.contains('hidden')) {
      videoPlayer.muted = false;
      unmutePrompt.classList.add('hidden');
    }
  });

  // Extraction logic
  async function handleExtract() {
    const rawUrl = urlInput.value.trim();
    if (!rawUrl) {
      showError('Please paste a video URL first.');
      urlInput.focus();
      return;
    }

    hideError();
    setLoading(true);
    unmutePrompt.classList.add('hidden');

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });

      const data = await res.json();

      if (!res.ok || (!data.success && !data.qualities?.length)) {
        throw new Error(data.detail || data.error || 'Failed to extract video stream.');
      }

      currentVideoData = data;
      renderPlayer(data);
    } catch (err) {
      console.error(err);
      showError(err.message || 'Could not load video. Check the link and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Render video & metadata
  function renderPlayer(data) {
    placeholder.classList.add('hidden');
    videoPlayer.classList.remove('hidden');
    videoMeta.classList.remove('hidden');

    videoTitle.textContent = data.title || 'Video';

    currentQualities = data.qualities || [];
    qualitySelect.innerHTML = '';

    currentQualities.forEach((q, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = q.label;
      qualitySelect.appendChild(opt);
    });

    const defaultIdx = data.default_quality_index ?? 0;
    qualitySelect.value = defaultIdx;

    loadStream(defaultIdx, false);
  }

  // Load and autoplay stream
  function loadStream(index, retainTime = false) {
    if (!currentQualities || !currentQualities[index]) return;
    const q = currentQualities[index];
    const prevTime = retainTime ? videoPlayer.currentTime : 0;

    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }

    videoPlayer.autoplay = true;

    if (q.is_hls) {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(q.video_url);
        hlsInstance.attachMedia(videoPlayer);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          if (retainTime && prevTime > 0) videoPlayer.currentTime = prevTime;
          attemptAutoplay();
        });
      } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.src = q.video_url;
        if (retainTime && prevTime > 0) videoPlayer.currentTime = prevTime;
        attemptAutoplay();
      }
    } else {
      const streamUrl = q.play_url || q.video_url;
      videoPlayer.src = streamUrl;
      videoPlayer.load();

      if (retainTime && prevTime > 0) {
        videoPlayer.currentTime = prevTime;
      }

      // Autoplay as soon as data is ready
      videoPlayer.addEventListener('canplay', () => {
        attemptAutoplay();
      }, { once: true });

      // Immediate attempt
      attemptAutoplay();
    }

    // Apply speed
    videoPlayer.playbackRate = parseFloat(speedSelect.value);
  }

  // Robust Autoplay handler
  function attemptAutoplay() {
    videoPlayer.playbackRate = parseFloat(speedSelect.value);

    // Try unmuted play first
    const playPromise = videoPlayer.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Playing unmuted successfully!
        unmutePrompt.classList.add('hidden');
      }).catch(err => {
        console.warn('Unmuted autoplay blocked by browser policy. Falling back to muted autoplay.', err);
        // Fallback: Muted autoplay is always permitted by browsers
        videoPlayer.muted = true;
        videoPlayer.play().then(() => {
          // Show unmute prompt so user knows they can unmute with one click
          unmutePrompt.classList.remove('hidden');
        }).catch(e => {
          console.error('Autoplay failed completely:', e);
        });
      });
    }
  }

  // Quality switch
  qualitySelect.addEventListener('change', () => {
    const idx = parseInt(qualitySelect.value, 10);
    loadStream(idx, true);
  });

  // Keyboard shortcut: Space (play/pause), M (unmute/mute), arrows (seek)
  window.addEventListener('keydown', (e) => {
    if (document.activeElement === urlInput) return;

    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (videoPlayer.paused) videoPlayer.play();
      else videoPlayer.pause();
    } else if (e.key.toLowerCase() === 'm') {
      videoPlayer.muted = !videoPlayer.muted;
      if (!videoPlayer.muted) unmutePrompt.classList.add('hidden');
    } else if (e.key === 'ArrowLeft') {
      videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 5);
    } else if (e.key === 'ArrowRight') {
      videoPlayer.currentTime = Math.min(videoPlayer.duration || Infinity, videoPlayer.currentTime + 5);
    }
  });

  // Helpers
  function setLoading(loading) {
    if (loading) {
      btnPlay.disabled = true;
      btnSpinner.classList.remove('hidden');
      btnText.textContent = '';
      videoLoader.classList.remove('hidden');
    } else {
      btnPlay.disabled = false;
      btnSpinner.classList.add('hidden');
      btnText.textContent = 'Play';
      videoLoader.classList.add('hidden');
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('hidden');
  }

  function hideError() {
    errorAlert.classList.add('hidden');
  }
});
