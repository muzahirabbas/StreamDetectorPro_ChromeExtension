(() => {
  /**
   * Facebook Deep Scanner
   * This script targets the complex data structures Facebook embeds in its page source.
   * It searches for script tags containing GraphQL responses or other JSON data
   * and parses them to find direct, high-quality video URLs.
   */
  console.log("Facebook Deep Scanner Injected (Advanced).");

  const streams = [];
  const foundUrls = new Set();

  try {
    const scripts = document.querySelectorAll('script[type="application/json"], script');
    scripts.forEach(script => {
      // Facebook often puts data in JSON inside script tags.
      // We look for objects that contain video-related keys.
      if (!script.textContent.includes('playable_url')) return;

      try {
        const data = JSON.parse(script.textContent);
        // Recursively search the parsed JSON for video URLs
        findVideosInJson(data);
      } catch (e) {
        // Not all scripts with 'playable_url' are valid JSON, so we ignore errors.
      }
    });

    function findVideosInJson(obj) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (key === 'playable_url' && typeof value === 'string' && !foundUrls.has(value)) {
            foundUrls.add(value);
            streams.push({
              url: value,
              quality: 'SD Video'
            });
          }
          if (key === 'playable_url_quality_hd' && typeof value === 'string' && !foundUrls.has(value)) {
            foundUrls.add(value);
            streams.push({
              url: value,
              quality: 'HD Video'
            });
          }
          if (typeof value === 'object' && value !== null) {
            findVideosInJson(value);
          }
        }
      }
    }
    
    // Final check for any video tags missed
    document.querySelectorAll('video').forEach(video => {
        if (video.src && !video.src.startsWith('blob:') && !foundUrls.has(video.src)) {
            foundUrls.add(video.src);
            streams.push({ url: video.src, quality: 'Direct Source' });
        }
    });

  } catch (e) {
    console.error("Error during Facebook scan:", e);
  }

  if (streams.length > 0) {
    console.log(`Found ${streams.length} Facebook streams.`);
    chrome.runtime.sendMessage({ type: 'deepScanResult', streams });
  } else {
    console.log("Facebook deep scan found no streams.");
  }
})();