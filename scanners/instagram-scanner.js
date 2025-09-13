(() => {
  /**
   * Instagram Deep Scanner
   * This script targets data embedded in Instagram's page source,
   * particularly for Reels and video posts. It looks for specific JSON
   * structures known to contain video metadata.
   */
  console.log("Instagram Deep Scanner Injected (Advanced).");
  
  const streams = [];
  const foundUrls = new Set();

  try {
    // Strategy 1: Look for the sharedData object, a common place for page data.
    const scripts = Array.from(document.querySelectorAll('script'));
    const dataScript = scripts.find(s => s.textContent.startsWith('window.__additionalDataLoaded'));

    if (dataScript) {
        // Extract JSON from the script content
        const jsonText = dataScript.textContent.match(/({.+});/)[1];
        const jsonData = JSON.parse(jsonText);
        findVideosInJson(jsonData);
    }
    
    // Strategy 2: Look for JSON-LD structured data (often used for SEO).
    const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
    if (jsonLdScript) {
        const jsonLdData = JSON.parse(jsonLdScript.textContent);
        if (jsonLdData.video && jsonLdData.video.contentUrl && !foundUrls.has(jsonLdData.video.contentUrl)) {
            const url = jsonLdData.video.contentUrl;
            foundUrls.add(url);
            streams.push({
                url: url,
                quality: 'JSON-LD Source'
            });
        }
    }
    
    // This recursive function will dig through any object to find video URLs.
    function findVideosInJson(obj) {
      if (!obj) return;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (key === 'video_url' && typeof value === 'string' && !foundUrls.has(value)) {
              foundUrls.add(value);
              streams.push({ url: value, quality: 'HD Video' });
          }
          // Instagram often lists multiple versions
          if (key === 'video_versions' && Array.isArray(value)) {
              value.forEach(version => {
                  if (version.url && !foundUrls.has(version.url)) {
                      foundUrls.add(version.url);
                      streams.push({
                          url: version.url,
                          quality: `${version.width}x${version.height}`
                      });
                  }
              });
          }
          if (typeof value === 'object' && value !== null) {
            findVideosInJson(value);
          }
        }
      }
    }

  } catch (e) {
    console.error("Error during Instagram scan:", e);
  }

  if (streams.length > 0) {
    console.log(`Found ${streams.length} Instagram streams.`);
    chrome.runtime.sendMessage({ type: 'deepScanResult', streams });
  } else {
    console.log("Instagram deep scan found no streams.");
  }
})();