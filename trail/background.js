// Trail – Background service worker
// Makes the Groq request on behalf of the content script. A content-script
// fetch runs under the host page's origin (CORS/CSP of chatgpt.com / gemini),
// while the service worker uses the extension's host_permissions.

importScripts('shared.js');

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'TRAIL_OPTIMIZE' || sender.id !== chrome.runtime.id) return;

  (async () => {
    try {
      const { trail_groq_api_key: apiKey, trail_domain } =
        await chrome.storage.local.get(['trail_groq_api_key', 'trail_domain']);
      const domainKey = trail_domain || 'general';
      const text = apiKey
        ? await requestGroq(String(msg.rawInput || ''), domainKey, apiKey)
        : buildFallbackPrompt(String(msg.rawInput || ''), domainKey);
      sendResponse({ ok: true, text });
    } catch (err) {
      sendResponse({ ok: false, error: err.message || String(err) });
    }
  })();

  return true; // keep the channel open for the async response
});

// Keyboard shortcut (see "commands" in manifest.json): tell the active tab's
// content script to run the same action as clicking the inline button.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'optimize-prompt') return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TRAIL_TRIGGER' });
  } catch (_) { /* not a ChatGPT / Gemini tab, or the page has not loaded Trail */ }
});
