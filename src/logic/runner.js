export function runSnippet(code) {
    // Check if we are in Chrome Extension environment
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create && chrome.runtime && chrome.runtime.getURL) {
        // 1. Store code in localStorage (shared across extension pages)
        localStorage.setItem('code_pocket_temp_run', code);

        // 2. Open the viewer page
        const viewerUrl = chrome.runtime.getURL('src/viewer.html');
        chrome.tabs.create({ url: viewerUrl });
    } else {
        // Fallback for local development
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }
}
