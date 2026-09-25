chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['pvpEnabled'], (result) => {
    if (result.pvpEnabled === undefined) {
      chrome.storage.local.set({ pvpEnabled: true });
      updateBadge(true);
    } else {
      updateBadge(result.pvpEnabled);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateBadge') {
    updateBadge(request.enabled);
  }
});

function updateBadge(isEnabled) {
  const text = isEnabled ? 'ON' : 'OFF';
  const color = isEnabled ? '#FF8800' : '#888888';
  
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
}
