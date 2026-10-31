// ─────────────────────────────────────────────────────────────────────────────
// Trail – Content Script
// DOM Injection · SPA Robustness · Domain Awareness · Token Toast
// Presets, token estimate and fallback come from shared.js (loaded first).
// The Groq request is made by background.js.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const TRAIL_BTN_ID      = 'trail-inline-btn';
const TRAIL_DEBOUNCE_MS = 350;

// ── Utility: Debounce ───────────────────────────────────────────────────────
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ── Input Selectors per Site ────────────────────────────────────────────────
function findInputElement() {
  const chatGPT = document.querySelector('#prompt-textarea');
  if (chatGPT) return chatGPT;

  const gemini = document.querySelector(
    'div.ql-editor[contenteditable="true"], ' +
    'rich-textarea div[contenteditable="true"], ' +
    'div[data-testid="input-area"] [contenteditable="true"]'
  );
  return gemini || null;
}

function readInputText(el) {
  return el.value || el.innerText || el.textContent || '';
}

// Write text so the host framework (React / ProseMirror / Quill) notices it.
function writeInputText(el, text) {
  el.focus();

  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    // React-controlled inputs ignore plain `.value =`; use the native setter.
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }

  // contenteditable: select everything and insert as if typed
  const sel   = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);

  const inserted = document.execCommand('insertText', false, text);
  if (!inserted) {
    el.innerText = text;
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
  }
}

// ── Toasts ──────────────────────────────────────────────────────────────────
function showTokenToast(rawText, optimizedText, onUndo) {
  document.querySelectorAll('.trail-toast').forEach(el => el.remove());

  const raw   = estimateTokens(rawText);
  const opt   = estimateTokens(optimizedText);
  const delta = raw - opt;
  const pct   = raw > 0 ? Math.round((Math.abs(delta) / raw) * 100) : 0;

  const toast  = document.createElement('div');
  toast.className = 'trail-toast';

  const iconEl = document.createElement('span');
  iconEl.className = 'toast-icon';
  const msgEl = document.createElement('span');

  if (delta > 0) {
    iconEl.textContent = '⚡';
    msgEl.textContent  = `Trail: −${delta} tokens saved (${pct}%)`;
    msgEl.className    = 'toast-gain';
  } else if (delta < 0) {
    iconEl.textContent = '📊';
    msgEl.textContent  = `Trail: +${Math.abs(delta)} tokens (structured)`;
    msgEl.className    = 'toast-loss';
  } else {
    iconEl.textContent = '✓';
    msgEl.textContent  = 'Trail: Prompt optimized';
  }

  toast.appendChild(iconEl);
  toast.appendChild(msgEl);

  // Trail overwrites the chat box, so offer a way back to the original draft.
  if (onUndo) {
    const undo = document.createElement('button');
    undo.type = 'button';
    undo.className = 'trail-toast-undo';
    undo.textContent = '↩ Undo';
    undo.addEventListener('click', () => {
      onUndo();
      toast.remove();
    });
    toast.classList.add('has-action');
    toast.appendChild(undo);
  }
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, onUndo ? 9000 : 3500);
}

function showSimpleToast(msg) {
  document.querySelectorAll('.trail-toast').forEach(el => el.remove());
  const toast = document.createElement('div');
  toast.className = 'trail-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Button rendering ────────────────────────────────────────────────────────
function renderTrailButton(btn, label) {
  btn.replaceChildren(document.createTextNode('🌲 Trail '));
  const pill = document.createElement('span');
  pill.className = 'trail-domain-pill';
  pill.textContent = label;
  btn.appendChild(pill);
}

function refreshPill(btn) {
  try {
    chrome.storage.local.get(['trail_domain'], (result) => {
      const preset = DOMAIN_PRESETS[result.trail_domain] || DOMAIN_PRESETS.general;
      renderTrailButton(btn, preset.pill || preset.label);
    });
  } catch (_) { /* extension context invalidated (reloaded) */ }
}

// Keep the pill in sync when the domain is changed in the popup
try {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.trail_domain) return;
    const btn = document.getElementById(TRAIL_BTN_ID);
    if (btn && !btn.disabled) refreshPill(btn);
  });
} catch (_) { /* ignore */ }

// ── Inject Button ───────────────────────────────────────────────────────────
function injectTrailButton() {
  const inputElement = findInputElement();
  if (!inputElement) return;

  const existing = document.getElementById(TRAIL_BTN_ID);
  if (existing) {
    if (document.contains(existing) && document.contains(inputElement)) return;
    existing.remove();
  }

  const btn = document.createElement('button');
  btn.id        = TRAIL_BTN_ID;
  btn.className = 'trail-inject-btn';
  btn.type      = 'button';
  btn.setAttribute('aria-label', 'Trail: Optimize this prompt');
  renderTrailButton(btn, DOMAIN_PRESETS.general.pill);
  refreshPill(btn);

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const currentInput = findInputElement();
    if (!currentInput) {
      console.warn('[Trail] Input element no longer in DOM — skipping.');
      return;
    }
    await handleInlineOptimization(currentInput, btn);
  });

  const anchor = inputElement.closest('form') || inputElement.parentElement;
  if (anchor && anchor.parentElement) {
    anchor.parentElement.insertAdjacentElement('afterend', btn);
  } else if (inputElement.parentElement) {
    inputElement.parentElement.appendChild(btn);
  }
}

// ── Handle Inline Optimization ──────────────────────────────────────────────
async function handleInlineOptimization(inputElement, btn) {
  const rawText = readInputText(inputElement);

  if (!rawText.trim()) {
    showSimpleToast('Type a draft in the input box first!');
    return;
  }
  if (rawText.length > TRAIL_MAX_INPUT) {
    showSimpleToast('Please keep drafts under 20,000 characters.');
    return;
  }

  // Pause observer during async work to prevent re-injection races
  observer.disconnect();

  btn.className   = 'trail-inject-btn loading';
  btn.textContent = 'Optimizing…';
  btn.disabled    = true;

  try {
    const resp = await chrome.runtime.sendMessage({ type: 'TRAIL_OPTIMIZE', rawInput: rawText });
    if (!resp)     throw new Error('No response from the Trail background worker.');
    if (!resp.ok)  throw new Error(resp.error || 'Unknown error.');

    // The input may have been re-rendered while we waited
    const target = document.contains(inputElement) ? inputElement : findInputElement();
    if (!target) throw new Error('Chat input is no longer available.');

    writeInputText(target, resp.text);
    showTokenToast(rawText, resp.text, () => {
      const t = document.contains(target) ? target : findInputElement();
      if (t) writeInputText(t, rawText);
    });
  } catch (err) {
    console.error('[Trail] Inline optimization error:', err);
    const msg = /context invalidated/i.test(err.message)
      ? 'Trail was updated — please refresh this page.'
      : `Trail Error: ${err.message}`;
    showSimpleToast(msg);
  } finally {
    btn.className = 'trail-inject-btn';
    btn.disabled  = false;
    refreshPill(btn);
    resumeObserver();
  }
}

// ── Keyboard shortcut (Alt+Shift+T, sent from background.js) ────────────────
try {
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== 'TRAIL_TRIGGER') return;
    const btn = document.getElementById(TRAIL_BTN_ID);
    if (btn && !btn.disabled) btn.click();
    else if (!btn) showSimpleToast('Click into the chat box first, then try again.');
  });
} catch (_) { /* extension context invalidated */ }

// ── SPA Navigation ──────────────────────────────────────────────────────────
// Content scripts run in an isolated world, so patching history.pushState here
// never sees the page's own calls. Instead: popstate/hashchange events (which
// do cross worlds) plus a URL check inside the debounced mutation callback.
let lastUrl = location.href;

function cleanupInjectedElements() {
  const existing = document.getElementById(TRAIL_BTN_ID);
  if (existing) existing.remove();
}

function onRouteChange() {
  lastUrl = location.href;
  cleanupInjectedElements();
  setTimeout(injectTrailButton, 600);
}

window.addEventListener('popstate',   onRouteChange);
window.addEventListener('hashchange', onRouteChange);

function checkRouteAndInject() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    cleanupInjectedElements();
  }
  injectTrailButton();
}

// ── Mutation Observer ───────────────────────────────────────────────────────
const observer = new MutationObserver(debounce(checkRouteAndInject, TRAIL_DEBOUNCE_MS));

function resumeObserver() {
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
}

// Boot
resumeObserver();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectTrailButton);
} else {
  injectTrailButton();
}
