export function runSnippet(code) {
  // Use data: URL to open HTML - completely bypasses extension CSP
  const dataUrl = "data:text/html;charset=utf-8," + encodeURIComponent(code);

  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.create({ url: dataUrl });
  } else {
    window.open(dataUrl, "_blank");
  }
}
