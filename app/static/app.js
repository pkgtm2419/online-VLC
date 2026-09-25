/**
 * PVP (Personal Video Player) - Client Logic
 * Authentic VLC Media Player layout, shortcuts, playlist support,
 * true VLC fullscreen mode with 5s cursor/footer autohide, and robust duration/seeking.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - VLC Window & Menubar
  const vlcWindow = document.getElementById('vlcWindow');
  const windowTitle = document.getElementById('windowTitle');
  const btnMenuBarStream = document.getElementById('btnMenuBarStream');

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
  openStreamModal();
  setTimeout(() => urlModalInput.focus(), 200);

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
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });

      const data = await res.json();
      let finalData = data;
      const isYouTubeUrl = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/.exec(rawUrl);

      if (!res.ok || (!data.success && !data.qualities?.length && !data.entries?.length) || (data.qualities?.length === 1 && data.qualities[0].label === 'Direct' && isYouTubeUrl)) {
        if (isYouTubeUrl) {
          const ytId = isYouTubeUrl[1];
          let ytTitle = (data && data.title && data.title !== 'Stream Video') ? data.title : 'YouTube Video';
          try {
            const oRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${ytId}&format=json`);
            if (oRes.ok) {
              const oData = await oRes.json();
              ytTitle = oData.title || ytTitle;
            }
          } catch (_) {}

          finalData = {
            success: true,
            title: ytTitle,
            is_embed_fallback: true,
            qualities: [{
              label: 'Auto',
              type: 'embed',
              video_url: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`
            }],
            default_quality_index: 0
          };
        } else {
          throw new Error(data.detail || data.error || 'Failed to extract video stream.');
        }
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
      row.innerHTML = `
        <span class="col-num">${idx + 1}</span>
        <span class="col-title" title="${item.title}">${item.title}</span>
        <span class="col-dur">${item.duration_str || '--:--'}</span>
      `;
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
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: track.url })
      });
      const data = await res.json();
      let finalData = data;
      const isYouTubeUrl = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/.exec(track.url);
      if (!res.ok || (!data.success && !data.qualities?.length) || (data.qualities?.length === 1 && data.qualities[0].label === 'Direct' && isYouTubeUrl)) {
        if (isYouTubeUrl) {
          const ytId = isYouTubeUrl[1];
          finalData = {
            success: true,
            title: track.title,
            is_embed_fallback: true,
            qualities: [{
              label: 'Auto',
              type: 'embed',
              video_url: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`
            }],
            default_quality_index: 0
          };
        }
      }
      track.data = finalData;
      loadVideoData(finalData);
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
      if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(q.video_url);
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
        videoPlayer.src = q.video_url;
        if (startTime > 0) videoPlayer.currentTime = startTime;
        triggerAutoplay();
      }
    } else {
      // Direct stream or live muxed stream
      let streamUrl = q.play_url || q.video_url;
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
    alert('PVP (Personal Video Player)\nUniversal Ad-Free Streaming Player\nBuilt with FastAPI & yt-dlp');
  });
});
