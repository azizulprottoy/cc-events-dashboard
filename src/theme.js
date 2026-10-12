import { useEffect, useState } from 'react';

// Lets a startup's site restyle the dashboard to match its own theme:
//   - query params on any page, e.g. /l/<token>?mode=dark&primary=%2316a34a&bg=%230f172a
//   - when framed, live updates from the parent page:
//       iframe.contentWindow.postMessage({ type: 'cc-events:theme', theme: { mode, primary, bg } }, origin)
// The theme is kept for the tab's session so it survives navigation.

const STORAGE_KEY = 'mp_theme';
const MESSAGE_TYPE = 'cc-events:theme';
const CHANGE_EVENT = 'mp-theme-change';

const isColor = (value) => typeof value === 'string' && value.length <= 64 && CSS.supports('color', value);

// Only known keys with valid values get through; everything else is dropped.
function sanitize(raw = {}) {
  const theme = {};
  if (raw.mode === 'light' || raw.mode === 'dark') theme.mode = raw.mode;
  if (isColor(raw.primary)) theme.primary = raw.primary;
  if (isColor(raw.bg)) theme.bg = raw.bg;
  return theme;
}

// Readable text color on top of `color`: render it to a pixel to get RGB
// (works for hex, rgb, hsl, oklch...) and pick by relative luminance.
function contentColorFor(color) {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return '#ffffff';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.4 ? '#111827' : '#ffffff';
}

function readStored() {
  try {
    return sanitize(JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return {};
  }
}

function store(theme) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Storage blocked (e.g. some third-party iframes): theme still applies for this page.
  }
}

function apply(theme) {
  const root = document.documentElement;
  if (theme.mode) root.setAttribute('data-theme', theme.mode);
  else root.removeAttribute('data-theme');

  const vars = {
    '--color-primary': theme.primary,
    '--color-primary-content': theme.primary && contentColorFor(theme.primary),
    '--color-base-100': theme.bg,
  };
  for (const [name, value] of Object.entries(vars)) {
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function update(partial) {
  const theme = { ...readStored(), ...sanitize(partial) };
  store(theme);
  apply(theme);
}

export function initTheme() {
  const params = new URLSearchParams(window.location.search);
  update({ mode: params.get('mode'), primary: params.get('primary'), bg: params.get('bg') });

  if (window.self !== window.top) {
    window.addEventListener('message', (event) => {
      if (event.source !== window.parent || event.data?.type !== MESSAGE_TYPE) return;
      update(event.data.theme || {});
    });
  }
}

/** Current primary color, for charts (SVG fills can't use daisyUI classes). */
export function usePrimaryColor(fallback = '#6366f1') {
  const read = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || fallback;
  const [color, setColor] = useState(read);
  useEffect(() => {
    const onChange = () => setColor(read());
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return color;
}

// Recharts tooltips follow the dashboard theme (light/dark, host colors)
// instead of the library's fixed white box.
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--color-base-100)',
    border: '1px solid var(--color-base-300)',
    borderRadius: 8,
    color: 'var(--color-base-content)',
    boxShadow: '0 4px 12px rgb(0 0 0 / 0.15)',
  },
  labelStyle: { color: 'var(--color-base-content)', fontWeight: 600 },
};
