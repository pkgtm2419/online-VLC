document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-btn');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  function renderState(isEnabled) {
    toggleBtn.checked = isEnabled;
    if (isEnabled) {
      statusDot.classList.remove('disabled');
      statusText.textContent = 'ENABLED';
      statusText.style.color = '#FF8800';
    } else {
      statusDot.classList.add('disabled');
      statusText.textContent = 'DISABLED';
      statusText.style.color = '#888888';
    }
  }

  // Load initial state
  chrome.storage.local.get(['pvpEnabled'], (result) => {
    const isEnabled = result.pvpEnabled !== false; // Default true
    renderState(isEnabled);
  });

  // Handle toggle
  toggleBtn.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    renderState(isEnabled);
    chrome.storage.local.set({ pvpEnabled: isEnabled }, () => {
      chrome.runtime.sendMessage({ action: 'updateBadge', enabled: isEnabled });
    });
  });
});
