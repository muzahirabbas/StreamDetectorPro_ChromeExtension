document.addEventListener('DOMContentLoaded', () => {
  const streamsList = document.getElementById('streams-list');
  const placeholder = document.getElementById('placeholder');
  const clearButton = document.getElementById('clear-button');
  const deepScanSection = document.getElementById('deep-scan-section');
  const scanButtonContainer = document.getElementById('scan-button-container');

  let currentTabId; // Store current tab ID

  // **MODIFIED**: Refreshes the stream list from the background script
  function refreshStreamsList() {
    if (!currentTabId) return;
    chrome.runtime.sendMessage({ type: 'getStreams', tabId: currentTabId }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        placeholder.textContent = 'Error loading streams.';
        renderStreams([]);
        return;
      }
      if (response && response.streams) {
        renderStreams(response.streams);
      }
    });
  }

  function renderStreams(streams) {
    streamsList.innerHTML = '';
    if (streams && streams.length > 0) {
      placeholder.classList.add('hidden');
      clearButton.classList.remove('hidden');

      streams.forEach(stream => {
        const li = document.createElement('li');
        li.className = 'stream-item';

        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'stream-details';

        const urlSpan = document.createElement('span');
        urlSpan.className = 'stream-url';
        const urlText = stream.url;
        // Truncate long URLs for display
        urlSpan.textContent = urlText.length > 80 ? urlText.substring(0, 40) + '...' + urlText.substring(urlText.length - 40) : urlText;
        urlSpan.title = urlText;
        detailsDiv.appendChild(urlSpan);

        const metadataDiv = document.createElement('div');
        metadataDiv.className = 'stream-metadata';
        
        const sourceSpan = document.createElement('span');
        sourceSpan.className = `stream-source stream-source-${stream.source.replace(' ', '-')}`;
        sourceSpan.textContent = stream.source;
        metadataDiv.appendChild(sourceSpan);

        if (stream.size) {
          const sizeSpan = document.createElement('span');
          sizeSpan.className = 'stream-size';
          sizeSpan.textContent = stream.size;
          metadataDiv.appendChild(sizeSpan);
        }

        if (stream.quality) {
          const qualitySpan = document.createElement('span');
          qualitySpan.className = 'stream-quality';
          qualitySpan.textContent = stream.quality;
          metadataDiv.appendChild(qualitySpan);
        }

        detailsDiv.appendChild(metadataDiv);
        
        // **MODIFIED**: A container for action buttons
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'stream-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(stream.url).then(() => {
            copyBtn.textContent = 'Copied!';
            copyBtn.classList.add('copied');
            setTimeout(() => {
              copyBtn.textContent = 'Copy';
              copyBtn.classList.remove('copied');
            }, 2000);
          });
        });
        
        actionsDiv.appendChild(copyBtn);
        
        li.appendChild(detailsDiv);
        li.appendChild(actionsDiv);
        streamsList.appendChild(li);
      });
    } else {
      streamsList.innerHTML = ''; // Clear previous content
      streamsList.appendChild(placeholder);
      placeholder.classList.remove('hidden');
      clearButton.classList.add('hidden');
    }
  }

  // **NEW**: Sets up the deep scan button based on the page URL
  function setupDeepScanButton(url) {
    let platform = null;
    let btnText = '';
    let btnClass = '';

    if (url.includes('youtube.com')) {
      platform = 'youtube';
      btnText = 'Scan YouTube Page';
      btnClass = 'youtube-scan-btn';
    } else if (url.includes('facebook.com')) {
      platform = 'facebook';
      btnText = 'Scan Facebook Page';
      btnClass = 'facebook-scan-btn';
    } else if (url.includes('instagram.com')) {
      platform = 'instagram';
      btnText = 'Scan Instagram Page';
      btnClass = 'instagram-scan-btn';
    }

    if (platform) {
      deepScanSection.classList.remove('hidden');
      const scanButton = document.createElement('button');
      scanButton.textContent = btnText;
      scanButton.className = btnClass;
      
      scanButton.addEventListener('click', () => {
        scanButton.textContent = 'Scanning...';
        scanButton.disabled = true;
        chrome.runtime.sendMessage({ type: 'deepScan', tabId: currentTabId, platform: platform }, (response) => {
            // After the scan is initiated, refresh the list to show results
            setTimeout(refreshStreamsList, 1000); // Give a moment for streams to be processed
            scanButton.textContent = btnText;
            scanButton.disabled = false;
        });
      });
      scanButtonContainer.appendChild(scanButton);
    }
  }

  // Main logic execution
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    const currentTab = tabs[0];
    currentTabId = currentTab.id;

    setupDeepScanButton(currentTab.url);
    refreshStreamsList();

    clearButton.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'clearStreams', tabId: currentTabId }, (response) => {
        if (response && response.success) {
          renderStreams([]);
        }
      });
    });
  });
});