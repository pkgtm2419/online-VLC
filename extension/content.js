// Keep track of processed elements to avoid duplicates
const processedElements = new WeakSet();

let isEnabled = true;

// Initialize
chrome.storage.local.get(['pvpEnabled'], (result) => {
  isEnabled = result.pvpEnabled !== false;
  if (isEnabled) {
    scanForVideos();
    observeDOM();
  }
});

// Listen for toggle changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.pvpEnabled) {
    isEnabled = changes.pvpEnabled.newValue;
    if (isEnabled) {
      scanForVideos();
    } else {
      removeAllButtons();
    }
  }
});

function getBestVideoUrl(el) {
  let videoUrl = el.src;
  
  if (!videoUrl || videoUrl.startsWith('blob:')) {
    const source = el.querySelector('source');
    if (source && source.src && !source.src.startsWith('blob:')) {
      videoUrl = source.src;
    }
  }
  
  if (el.tagName === 'IFRAME') {
    videoUrl = el.src;
  }
  
  // If the video URL is blob:, data:, or empty, fallback to the webpage's URL (e.g. YouTube, Vimeo, dailymotion, streaming sites)
  if (!videoUrl || videoUrl.startsWith('blob:') || videoUrl.startsWith('data:')) {
    if (window.location.href && window.location.href.startsWith('http')) {
      videoUrl = window.location.href;
    } else {
      return null;
    }
  }
  
  return videoUrl;
}

function createPvpButton(getVideoUrlFn) {
  const btn = document.createElement('button');
  btn.className = 'pvp-extension-btn';
  btn.title = 'Play with local PVP (VLC Player)';
  btn.setAttribute('aria-label', 'Open with PVP');
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right:5px;flex-shrink:0;">
      <path d="M20 90 L50 10 L80 90 Z" fill="#FFFFFF"/>
      <path d="M28 65 L72 65" stroke="#FF8800" stroke-width="8"/>
      <path d="M38 40 L62 40" stroke="#FF8800" stroke-width="8"/>
    </svg>
    <span>Open with PVP</span>
  `;
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const finalUrl = getVideoUrlFn();
    if (!finalUrl) {
      alert('Could not determine video URL for PVP.');
      return;
    }
    const targetUrl = `http://127.0.0.1:8000/?url=${encodeURIComponent(finalUrl)}`;
    window.open(targetUrl, '_blank');
  });
  return btn;
}

function processVideoElement(el) {
  if (processedElements.has(el)) return;
  
  // Only process visible or rendered videos
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0 && !el.src && !el.querySelector('source')) {
    return;
  }

  const parent = el.parentElement;
  if (!parent) return;

  processedElements.add(el);

  // Function to evaluate video URL at click time (in case src was set dynamically)
  const getVideoUrl = () => getBestVideoUrl(el);

  // Position parent relatively if static so absolute child button sits on top
  const parentPos = window.getComputedStyle(parent).position;
  if (parentPos === 'static') {
    parent.style.position = 'relative';
  }

  const btn = createPvpButton(getVideoUrl);

  // Insert button into parent container next to video
  parent.appendChild(btn);

  // Show button on hovering video or parent
  const showBtn = () => { if (isEnabled) btn.classList.add('pvp-visible'); };
  const hideBtn = () => { btn.classList.remove('pvp-visible'); };

  el.addEventListener('mouseenter', showBtn);
  el.addEventListener('mouseleave', hideBtn);
  parent.addEventListener('mouseenter', showBtn);
  parent.addEventListener('mouseleave', hideBtn);
  btn.addEventListener('mouseenter', showBtn);
}

function scanForVideos() {
  if (!isEnabled) return;
  const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="embed"], iframe[src*="player"]');
  videos.forEach(processVideoElement);
}

function removeAllButtons() {
  document.querySelectorAll('.pvp-extension-btn').forEach(btn => btn.remove());
}

function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    let shouldScan = false;
    for (let mutation of mutations) {
      if (mutation.addedNodes.length) {
        shouldScan = true;
        break;
      }
    }
    if (shouldScan) {
      clearTimeout(window.pvpScanTimeout);
      window.pvpScanTimeout = setTimeout(scanForVideos, 400);
    }
  });
  
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
