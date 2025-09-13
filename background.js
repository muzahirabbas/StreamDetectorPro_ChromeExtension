// This object will hold the streams detected for each tab.
// The key is the tabId, and the value is a Map of URLs to stream data.
const detectedStreams = {};

// Regex to match common video and manifest file extensions.
const videoPatterns = /\.(m3u8|mpd|mp4|webm|ogg|ts)(\?.*)?$/;

/**
 * Utility function to format bytes into a human-readable string (e.g., KB, MB).
 * @param {number} bytes - The number of bytes.
 * @returns {string|null} - The formatted size string or null if input is invalid.
 */
function formatBytes(bytes) {
  if (bytes === 0 || !bytes) return null;
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Adds or updates a stream in the storage for a specific tab.
 * @param {number} tabId - The ID of the tab.
 * @param {string} url - The URL of the stream.
 * @param {string} source - The detection method ('Network', 'Page', 'Deep Scan').
 * @param {object} metadata - Additional data like { size, quality }.
 */
function addStream(tabId, url, source, metadata = {}) {
  if (!url) return;

  if (!detectedStreams[tabId]) {
    detectedStreams[tabId] = new Map();
  }

  const existingStream = detectedStreams[tabId].get(url) || {};
  
  // Combine new and existing data, prioritizing the new info.
  const updatedStream = {
    source: source || existingStream.source,
    size: metadata.size || existingStream.size,
    quality: metadata.quality || existingStream.quality,
  };

  detectedStreams[tabId].set(url, updatedStream);
  updateBadge(tabId);
}

// ## Passive Network Listener ##
// Intercepts network requests to find video streams based on URL patterns
// and 'Content-Length' headers for file size.
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId >= 0 && videoPatterns.test(details.url)) {
      const metadata = {};
      const sizeHeader = details.responseHeaders.find(h => h.name.toLowerCase() === 'content-length');
      if (sizeHeader && sizeHeader.value) {
        metadata.size = formatBytes(parseInt(sizeHeader.value, 10));
      }
      addStream(details.tabId, details.url, 'Network', metadata);
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);


// ## Tab Management Listeners ##
// These ensure that data is cleared when a tab is reloaded or closed.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Clear streams when a tab starts loading a new page.
  if (changeInfo.status === 'loading') {
    if (detectedStreams[tabId]) {
      detectedStreams[tabId].clear();
      updateBadge(tabId);
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  // Garbage collection: remove data for closed tabs.
  if (detectedStreams[tabId]) {
    delete detectedStreams[tabId];
  }
});

/**
 * Updates the badge text on the extension icon to show the number of detected streams.
 * @param {number} tabId - The ID of the tab to update the badge for.
 */
function updateBadge(tabId) {
  const count = detectedStreams[tabId] ? detectedStreams[tabId].size : 0;
  chrome.action.setBadgeText({
    text: count > 0 ? count.toString() : '',
    tabId: tabId
  });
  chrome.action.setBadgeBackgroundColor({
      color: '#007bff',
      tabId: tabId
  });
}


// ## Message Listener ##
// This is the central hub that handles all communication from the popup and content scripts.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const tabId = sender.tab?.id || request.tabId;
  if (!tabId) return true;

  switch (request.type) {
    // Received from content.js when a <video> tag is found.
    case 'videoSourceFound':
      addStream(tabId, request.url, 'Page');
      // Attempt to get the file size with a HEAD request.
      fetch(request.url, { method: 'HEAD' })
        .then(response => {
          if (response.ok && response.headers.has('Content-Length')) {
            const size = formatBytes(parseInt(response.headers.get('Content-Length'), 10));
            if (size) {
              addStream(tabId, request.url, 'Page', { size });
            }
          }
        }).catch(() => {}); // Ignore fetch errors (e.g., CORS).
      break;

    // Received from popup.js to get the list of streams for the current tab.
    case 'getStreams':
      const streamsMap = detectedStreams[request.tabId] || new Map();
      const streamsArray = Array.from(streamsMap.entries()).map(([url, data]) => ({ url, ...data }));
      sendResponse({ streams: streamsArray });
      break;

    // Received from popup.js when the 'Clear' button is clicked.
    case 'clearStreams':
      if (detectedStreams[request.tabId]) {
        detectedStreams[request.tabId].clear();
        updateBadge(request.tabId);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
      break;
      
    // Received from popup.js to initiate a deep scan for a specific platform.
    case 'deepScan':
      let scriptToInject = '';
      if (request.platform === 'youtube') {
        scriptToInject = 'scanners/youtube-scanner.js';
      } else if (request.platform === 'facebook') {
        scriptToInject = 'scanners/facebook-scanner.js';
      } else if (request.platform === 'instagram') {
        scriptToInject = 'scanners/instagram-scanner.js';
      }

      if (scriptToInject) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [scriptToInject]
        });
      }
      sendResponse({ success: true });
      break;

    // Received from the injected scanner scripts with their findings.
    case 'deepScanResult':
      if (request.streams && request.streams.length > 0) {
        request.streams.forEach(stream => {
          addStream(tabId, stream.url, 'Deep Scan', { quality: stream.quality });
        });
      }
      break;
  }
  
  // Return true to indicate that we will send a response asynchronously.
  return true; 
});