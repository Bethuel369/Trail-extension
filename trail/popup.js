// ─────────────────────────────────────────────────────────────────────────────
// Trail – Popup Script
// Presets, token estimate, fallback and Groq request come from shared.js.
// ─────────────────────────────────────────────────────────────────────────────

function buildTokenBadge(rawText, optimizedText) {
  const rawTokens = estimateTokens(rawText);
  const optTokens = estimateTokens(optimizedText);
  const delta = rawTokens - optTokens;
  const pct = rawTokens > 0 ? Math.round((delta / rawTokens) * 100) : 0;

  const badge = document.getElementById('tokenBadge');
  const icon  = document.getElementById('badgeIcon');
  const label = document.getElementById('badgeLabel');
  const pill  = document.getElementById('badgeDelta');

  badge.className = '';

  if (delta > 0) {
    badge.classList.add('visible', 'badge-gain');
    icon.textContent  = '📉';
    label.textContent = `Raw ~${rawTokens} tk → Optimized ~${optTokens} tk`;
    pill.textContent  = `−${delta} tokens (${pct}% saved)`;
  } else if (delta < 0) {
    badge.classList.add('visible', 'badge-loss');
    icon.textContent  = '📈';
    label.textContent = `Raw ~${rawTokens} tk → Structured ~${optTokens} tk`;
    pill.textContent  = `+${Math.abs(delta)} tokens added`;
  } else {
    badge.classList.add('visible', 'badge-neutral');
    icon.textContent  = '⚖️';
    label.textContent = `Raw ~${rawTokens} tk → Optimized ~${optTokens} tk`;
    pill.textContent  = 'No change';
  }
}

// ── Status Helper ───────────────────────────────────────────────────────────
function setStatus(msg, type = '') {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = type; // 'error' | 'success' | ''
}

// ── Init: Restore saved settings ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['trail_groq_api_key', 'trail_domain'], (result) => {
    if (result.trail_groq_api_key) {
      document.getElementById('apiKey').value = result.trail_groq_api_key;
    }
    if (result.trail_domain && DOMAIN_PRESETS[result.trail_domain]) {
      document.getElementById('domainSelect').value = result.trail_domain;
    }
  });
});

// ── Persist API key on change ───────────────────────────────────────────────
// Save on `input` as well as `change`: the popup closes on outside click and
// `change` only fires on blur, so a pasted key could otherwise be lost.
['input', 'change'].forEach((evt) => {
  document.getElementById('apiKey').addEventListener(evt, (e) => {
    chrome.storage.local.set({ trail_groq_api_key: e.target.value.trim() });
  });
});

// ── Keep the draft if the popup closes (session-only, cleared with the browser)
const draftEl = document.getElementById('rawPrompt');
let draftTimer;
draftEl.addEventListener('input', () => {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try { chrome.storage.session.set({ trail_draft: draftEl.value }); } catch (_) { /* unsupported */ }
  }, 300);
});
try {
  chrome.storage.session.get(['trail_draft'], (r) => {
    if (r && r.trail_draft && !draftEl.value) draftEl.value = r.trail_draft;
  });
} catch (_) { /* unsupported */ }

// ── Persist selected domain on change ──────────────────────────────────────
document.getElementById('domainSelect').addEventListener('change', (e) => {
  chrome.storage.local.set({ trail_domain: e.target.value });
});

// ── Optimize Button ─────────────────────────────────────────────────────────
document.getElementById('optimizeBtn').addEventListener('click', async () => {
  const rawInput = document.getElementById('rawPrompt').value.trim();
  const domain   = document.getElementById('domainSelect').value;
  const apiKey   = document.getElementById('apiKey').value.trim();

  document.getElementById('tokenBadge').className = '';
  setStatus('');

  if (!rawInput) {
    setStatus('⚠ Please enter a raw draft prompt first.', 'error');
    return;
  }
  if (rawInput.length > TRAIL_MAX_INPUT) {
    setStatus('Please keep drafts under 20,000 characters.', 'error');
    return;
  }

  // No API key: use the local template
  if (!apiKey) {
    const fallbackOutput = buildFallbackPrompt(rawInput, domain);
    document.getElementById('structuredPrompt').value = fallbackOutput;
    buildTokenBadge(rawInput, fallbackOutput);
    setStatus('Local template used — add a Groq API key for AI optimization.', '');
    return;
  }

  const btn = document.getElementById('optimizeBtn');
  btn.textContent = '⚡ Optimizing…';
  btn.disabled    = true;
  setStatus('Trail is finding its path…');

  try {
    const optimized = await requestGroq(rawInput, domain, apiKey);
    document.getElementById('structuredPrompt').value = optimized;
    buildTokenBadge(rawInput, optimized);
    setStatus('Optimization complete ✓', 'success');
  } catch (err) {
    console.error('[Trail]', err);
    setStatus('Error: ' + err.message, 'error');
  } finally {
    btn.textContent = 'Optimize ↗';
    btn.disabled    = false;
  }
});

// ── Copy Button ─────────────────────────────────────────────────────────────
document.getElementById('copyBtn').addEventListener('click', () => {
  const outputText = document.getElementById('structuredPrompt').value;
  if (!outputText) {
    setStatus('Nothing to copy yet.', 'error');
    return;
  }
  navigator.clipboard.writeText(outputText).then(() => {
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.textContent = 'Copied ✓';
    setStatus('Copied to clipboard!', 'success');
    setTimeout(() => {
      copyBtn.textContent = 'Copy ⎘';
      setStatus('');
    }, 2000);
  }).catch(() => setStatus('Clipboard access failed. Select and copy the text instead.', 'error'));
});
