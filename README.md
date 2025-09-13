# **🎬 Stream Detector Pro**

**The ultimate Chrome extension for developers, researchers, and power-users to uncover and capture direct video stream URLs from any website.**

Stream Detector Pro goes beyond simple link grabbing. It employs a multi-layered detection strategy, including advanced, site-specific deep scanners for tough-to-crack platforms like YouTube, Facebook, and Instagram.

## **✨ Key Features**

Stream Detector Pro uses three distinct methods working in harmony to find every possible video stream on a page.

### **1\. passive Network Scanning**

* **Always On:** Automatically listens to network traffic in the background.  
* **Efficient:** Captures .mp4, .m3u8, .mpd, .webm, and other stream formats as they are requested by the page.  
* **Metadata Rich:** Fetches available metadata like file size directly from the network headers.

### **2\. On-Page HTML Scanning**

* **Instant Detection:** Scans the page's HTML for \<video\> tags and their sources as soon as the page loads.  
* **Dynamic Content Ready:** Uses a MutationObserver to detect videos that are added to the page dynamically (e.g., through infinite scrolling).

### **3\. 🚀 Advanced Deep Scanners**

This is the core power of the extension. For complex sites that hide their video sources, a targeted deep scanner can be manually triggered.

* **YouTube:**  
  * Goes beyond public APIs to parse the internal ytInitialPlayerResponse object.  
  * **Includes a signature deciphering engine** to unlock and access the highest-quality video and audio streams that are normally protected.  
* **Facebook:**  
  * Intelligently parses embedded GraphQL data structures within the page's source.  
  * Reliably extracts both SD and HD playable\_url links from video posts and reels.  
* **Instagram:**  
  * Pinpoints and decodes the JSON data embedded within post and reel pages.  
  * Extracts multiple video\_versions with different resolutions.

## **🛠️ Installation**

Since this extension is not on the Chrome Web Store, you need to install it manually in Developer Mode.

1. **Download the Code:**  
   * Clone the repository: git clone https://github.com/your-username/stream-detector-pro.git  
   * Or, download the project as a .zip file and extract it.  
2. **Open Chrome Extensions:**  
   * Open Google Chrome.  
   * Navigate to chrome://extensions.  
3. **Enable Developer Mode:**  
   * In the top-right corner of the extensions page, toggle the **"Developer mode"** switch to **ON**.  
4. **Load the Extension:**  
   * Click the **"Load unpacked"** button that appears.  
   * Select the folder where you cloned or extracted the project files.  
5. **Ready to Go\!**  
   * The Stream Detector Pro icon will appear in your Chrome toolbar. You're all set\!

## **📖 How to Use**

1. **Browse the Web:** Navigate to any page containing a video. The extension icon will show a badge with a number indicating how many streams have been passively detected.  
2. **View Detected Streams:** Click the extension icon in your toolbar. A popup will display a list of all URLs found, along with their source (Network or Page), size, and quality where available.  
3. **Perform a Deep Scan (for supported sites):**  
   * When you are on YouTube, Facebook, or Instagram, the popup window will show a special "Scan Page" button.  
   * Click this button to inject the advanced scanner into the page.  
   * The new, high-quality stream URLs will be added to the list with a Deep Scan label.

## **📁 Project Structure**

The project is organized to be clean and maintainable.
```
/  
├── icons/                \# Extension icons (16x16, 48x48, 128x128)  
├── scanners/             \# Advanced, site-specific scanner scripts  
│   ├── youtube-scanner.js  
│   ├── facebook-scanner.js  
│   └── instagram-scanner.js  
├── background.js         \# Core service worker (handles network, messages)  
├── content.js            \# Injected into pages to find \<video\> tags  
├── manifest.json         \# Extension configuration file  
├── popup.html            \# The HTML for the popup window  
├── popup.css             \# The CSS for the popup window  
└── popup.js              \# The JavaScript logic for the popup window
```
## **🤝 Contributing**

Contributions are welcome\! Whether you want to fix a bug, add a new feature, or improve a deep scanner for a website, your help is appreciated.

1. Fork the repository.  
2. Create a new branch (git checkout \-b feature/your-new-feature).  
3. Make your changes.  
4. Commit your changes (git commit \-am 'Add some feature').  
5. Push to the branch (git push origin feature/your-new-feature).  
6. Open a new Pull Request.

## **📜 License**

This project is licensed under the MIT License. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.
