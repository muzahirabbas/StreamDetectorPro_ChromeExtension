
// Use a Set to avoid sending duplicate URLs from the same page session.
const foundSources = new Set();

function findAndSendVideos() {
  document.querySelectorAll('video').forEach(video => {
    // Collect all possible sources: the 'src' attribute and <source> tags.
    const sources = [];
    if (video.src && !video.src.startsWith('blob:')) {
      sources.push(video.src);
    }
    video.querySelectorAll('source').forEach(sourceNode => {
      if (sourceNode.src && !sourceNode.src.startsWith('blob:')) {
        sources.push(sourceNode.src);
      }
    });

    for (const src of sources) {
      const absoluteUrl = new URL(src, window.location.href).href;
      if (!foundSources.has(absoluteUrl)) {
        foundSources.add(absoluteUrl);
        chrome.runtime.sendMessage({ type: 'videoSourceFound', url: absoluteUrl });
      }
    }
  });
}

// Initial scan when the document is ready.
findAndSendVideos();

// Use a MutationObserver to detect videos added to the page later.
const observer = new MutationObserver((mutations) => {
  let foundVideo = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes) {
      mutation.addedNodes.forEach(node => {
        if (node.tagName === 'VIDEO' || (node.querySelector && node.querySelector('video'))) {
          foundVideo = true;
        }
      });
    }
  }
  if (foundVideo) {
    findAndSendVideos();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
