(() => {
  /**
   * YouTube Deep Scanner
   * This script is injected to parse video data directly from the page's internal objects.
   * Key Feature: It includes a 'decipher' mechanism for streams that use a signature cipher,
   * which is essential for accessing many high-quality formats.
   */
  console.log("YouTube Deep Scanner Injected (Advanced).");

  async function getPlayerSource(playerUrl) {
    try {
      const response = await fetch(playerUrl);
      return await response.text();
    } catch (e) {
      console.error("Could not fetch YouTube player source:", e);
      return null;
    }
  }

  // This is the core logic for deciphering the signature.
  // It finds the deciphering functions within YouTube's player code.
  function getDecipherFunctions(playerSource) {
    const decipherDefinitionName = playerSource.match(/\"signature\",\s?([a-zA-Z0-9$]+)\(/);
    if (!decipherDefinitionName) return null;

    const funcName = decipherDefinitionName[1];
    const decipherFuncPattern = new RegExp(`var ${funcName}=function\\(a\\){a=a.split\\(\"\"\\);(.+?)};`);
    const decipherFuncMatch = playerSource.match(decipherFuncPattern);
    if (!decipherFuncMatch) return null;

    const decipherFuncBody = decipherFuncMatch[1];
    const helperObjectName = decipherFuncBody.split('.')[0];
    const helperObjectPattern = new RegExp(`var ${helperObjectName}={(.*?)};`, "s");
    const helperObjectMatch = playerSource.match(helperObjectPattern);
    if (!helperObjectMatch) return null;

    const helperObjectBody = helperObjectMatch[1];
    
    // We are essentially recreating the necessary JS functions in our script
    const helperFunctions = `var ${helperObjectName} = { ${helperObjectBody} };`;
    const decipherFunction = `var decipher = function(a) { a = a.split(""); ${decipherFuncBody} };`;

    return { helperFunctions, decipherFunction };
  }

  async function parseVideoData() {
    let playerResponse;
    try {
      // ytInitialPlayerResponse is the primary data object available on page load.
      const scripts = Array.from(document.getElementsByTagName('script'));
      const playerResponseScript = scripts.find(script => script.textContent.includes('ytInitialPlayerResponse'));
      const scriptContent = playerResponseScript.textContent;
      const jsonString = scriptContent.substring(scriptContent.indexOf('{'), scriptContent.lastIndexOf('}') + 1);
      playerResponse = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to find or parse ytInitialPlayerResponse.", e);
      return [];
    }
    
    if (!playerResponse || !playerResponse.streamingData) {
        console.error("Player response or streaming data not found.");
        return [];
    }

    const { formats, adaptiveFormats } = playerResponse.streamingData;
    const allFormats = [...(formats || []), ...(adaptiveFormats || [])];
    const finalStreams = [];

    let decipherLogic = null;
    
    // Check if any stream requires deciphering
    if (allFormats.some(f => f.signatureCipher)) {
        const playerUrl = "https://www.youtube.com" + playerResponse.playerAds.playerAdParams.playerJsUrl;
        const playerSource = await getPlayerSource(playerUrl);
        if (playerSource) {
            decipherLogic = getDecipherFunctions(playerSource);
        }
    }

    for (const format of allFormats) {
      let finalUrl = format.url;

      if (!finalUrl && format.signatureCipher) {
        if (!decipherLogic) {
          console.warn("Found a ciphered stream but couldn't get decipher logic. Skipping.");
          continue;
        }
        
        const cipherParams = new URLSearchParams(format.signatureCipher);
        const url = cipherParams.get('url');
        const sp = cipherParams.get('sp') || 'signature';
        const s = cipherParams.get('s'); // The scrambled signature
        
        // This is where we execute the deciphering logic we extracted
        const signature = new Function(`${decipherLogic.helperFunctions} ${decipherLogic.decipherFunction} return decipher("${s}");`)();
        finalUrl = `${url}&${sp}=${signature}`;
      }

      if (finalUrl) {
          let quality = format.qualityLabel || `${format.height}p${format.fps || ''}`;
          const type = format.mimeType.split(';')[0].split('/')[0];
          
          finalStreams.push({
            url: finalUrl,
            quality: `[${type.toUpperCase()}] ${quality}`,
          });
      }
    }
    return finalStreams;
  }

  parseVideoData().then(streams => {
    if (streams && streams.length > 0) {
      console.log(`Found ${streams.length} YouTube streams.`);
      chrome.runtime.sendMessage({ type: 'deepScanResult', streams });
    } else {
      console.log("YouTube deep scan found no streams.");
    }
  });

})();