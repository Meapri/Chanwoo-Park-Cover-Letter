import { LiquidGlass } from '../src';
import type { LiquidGlassOptions } from '../src';
import {
  EN_TRANSLATIONS,
  LANGUAGE_STORAGE_KEY,
  TRANSLATABLE_ATTRIBUTES,
  type SupportedLanguage,
} from './i18n';

interface GlassConfig extends LiquidGlassOptions {}

const loadingScreen = document.querySelector<HTMLElement>('[data-loading-screen]');
const loadingStatus = loadingScreen?.querySelector<HTMLElement>('[data-loading-status]');
const chromiumLike =
  typeof navigator !== 'undefined' &&
  /\b(?:Chrome|Chromium|Edg|OPR|SamsungBrowser)\//.test(navigator.userAgent);

if (loadingStatus) {
  loadingStatus.textContent = chromiumLike ? 'Chromium 기반 환경 확인' : 'Chrome 또는 Edge 권장';
}

const translationDictionary: Record<string, string> = EN_TRANSLATIONS;
const translationEntries = Object.entries(translationDictionary).sort(([left], [right]) => right.length - left.length);
const originalTextNodes = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();
const skipTranslationSelector =
  'script, style, code, pre, textarea, input, option, svg, canvas, [data-no-i18n]';

function readStoredLanguage(): SupportedLanguage {
  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
}

function persistLanguage(language: SupportedLanguage): void {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Some embedded browsers disable localStorage; the toggle still works for the current page.
  }
}

function normalizeTranslationKey(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function translateString(original: string): string {
  let translated = original;
  for (const [korean, english] of translationEntries) {
    if (translated.includes(korean)) translated = translated.split(korean).join(english);
  }

  if (translated !== original) return translated;

  const normalized = normalizeTranslationKey(original);
  const directTranslation = translationDictionary[normalized];
  if (!directTranslation) return original;

  const leading = original.match(/^\s*/)?.[0] ?? '';
  const trailing = original.match(/\s*$/)?.[0] ?? '';
  return `${leading}${directTranslation}${trailing}`;
}

function contextualTextTranslation(node: Text, original: string): string | undefined {
  const key = normalizeTranslationKey(original);
  const previous = node.previousSibling;
  const next = node.nextSibling;
  const previousCode = previous instanceof HTMLElement && previous.tagName === 'CODE' ? previous.textContent?.trim() : '';
  if (
    key === '에서' &&
    previous instanceof HTMLElement &&
    next instanceof HTMLElement &&
    previous.tagName === 'CODE' &&
    next.tagName === 'CODE'
  ) {
    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    return `${leading} combines${trailing}`;
  }
  if (
    key === '는' &&
    previous instanceof HTMLElement &&
    next instanceof HTMLElement &&
    previous.tagName === 'CODE' &&
    next.tagName === 'CODE'
  ) {
    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    const verbByCode: Record<string, string> = {
      'antigravity_cli.py': 'delegates only the',
      'db.py': 'uses',
      MTPHTTPServer: 'handles',
      'HangulInputContext.swift': 'manages',
      'ThreadSafeHangulInputContext.swift': 'uses',
    };
    return `${leading} ${verbByCode[previousCode ?? ''] ?? 'uses'}${trailing}`;
  }
  if (
    key === '에' &&
    previousCode === 'LLMModelFactory.swift' &&
    next instanceof HTMLElement &&
    next.tagName === 'CODE'
  ) {
    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    return `${leading} registers${trailing}`;
  }
  if (
    (key === '와' || key === '과') &&
    previous instanceof HTMLElement &&
    next instanceof HTMLElement &&
    previous.tagName === 'CODE' &&
    next.tagName === 'CODE'
  ) {
    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    return `${leading} and${trailing}`;
  }
  if (key === '먼저' && next instanceof HTMLElement && next.tagName === 'CODE') {
    const leading = original.match(/^\s*/)?.[0] ?? '';
    const trailing = original.match(/\s*$/)?.[0] ?? '';
    return `${leading}Start with${trailing}`;
  }
  return undefined;
}

function translateTextNodes(language: SupportedLanguage): void {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(skipTranslationSelector)) return NodeFilter.FILTER_REJECT;
      return normalizeTranslationKey(node.nodeValue ?? '')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const current = node.nodeValue ?? '';
    const original = originalTextNodes.get(node) ?? current;
    if (!originalTextNodes.has(node)) originalTextNodes.set(node, original);
    node.nodeValue = language === 'en' ? (contextualTextTranslation(node, original) ?? translateString(original)) : original;
  }
}

function translateAttributes(language: SupportedLanguage): void {
  for (const el of Array.from(document.querySelectorAll<Element>('*'))) {
    if (el.closest(skipTranslationSelector)) continue;
    for (const attribute of TRANSLATABLE_ATTRIBUTES) {
      const current = el.getAttribute(attribute);
      if (!current) continue;

      let originals = originalAttributes.get(el);
      if (!originals) {
        originals = new Map<string, string>();
        originalAttributes.set(el, originals);
      }
      if (!originals.has(attribute)) originals.set(attribute, current);

      const original = originals.get(attribute) ?? current;
      el.setAttribute(attribute, language === 'en' ? translateString(original) : original);
    }
  }

  const originalTitle = originalAttributes.get(document.documentElement)?.get('data-document-title') ?? document.title;
  let htmlOriginals = originalAttributes.get(document.documentElement);
  if (!htmlOriginals) {
    htmlOriginals = new Map<string, string>();
    originalAttributes.set(document.documentElement, htmlOriginals);
  }
  if (!htmlOriginals.has('data-document-title')) htmlOriginals.set('data-document-title', document.title);
  document.title = language === 'en' ? translateString(originalTitle) : originalTitle;
}

function syncLanguageToggle(language: SupportedLanguage): void {
  document.documentElement.lang = language;

  const button = document.querySelector<HTMLButtonElement>('[data-language-toggle]');
  if (!button) return;

  button.setAttribute('aria-pressed', language === 'en' ? 'true' : 'false');
  button.setAttribute('aria-label', language === 'en' ? 'Switch to Korean' : 'Switch to English');

  const current = button.querySelector<HTMLElement>('[data-language-current]');
  const target = button.querySelector<HTMLElement>('[data-language-target]');
  if (current) current.textContent = language === 'en' ? 'EN' : 'KR';
  if (target) target.textContent = language === 'en' ? 'KR' : 'EN';
}

function applyLanguage(language: SupportedLanguage): void {
  translateTextNodes(language);
  translateAttributes(language);
  syncLanguageToggle(language);
  requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
}

function setupLanguageToggle(): void {
  let language = readStoredLanguage();
  applyLanguage(language);

  const button = document.querySelector<HTMLButtonElement>('[data-language-toggle]');
  button?.addEventListener('click', () => {
    language = language === 'en' ? 'ko' : 'en';
    persistLanguage(language);
    applyLanguage(language);
  });
}

setupLanguageToggle();

const autoChipGlass: LiquidGlassOptions = {
  profile: 'control',
  preset: 'vivid',
  scheme: 'light',
  radius: 'pill',
  refraction: 54,
  thickness: 48,
};

const autoControlGlass: LiquidGlassOptions = {
  profile: 'auto',
  preset: 'auto',
  scheme: 'light',
  radius: 'pill',
};

function ensureGlass(el: HTMLElement, config: LiquidGlassOptions): void {
  el.classList.add('liquid-glass');
  el.dataset.glass ||= JSON.stringify(config);
}

for (const el of Array.from(
  document.querySelectorAll<HTMLElement>('.nav-action, .language-toggle, .hero-actions .secondary-action, .detail-back-link')
)) {
  ensureGlass(el, autoControlGlass);
  el.classList.add('lg-interactive');
}

for (const el of Array.from(document.querySelectorAll<HTMLElement>('.stack-cloud li'))) {
  ensureGlass(el, autoChipGlass);
}

for (const card of Array.from(document.querySelectorAll<HTMLElement>('[data-detail-href]'))) {
  card.setAttribute('role', 'link');
  card.tabIndex = 0;
  const href = card.dataset.detailHref;
  const openDetail = (event: MouseEvent | KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (!href || target?.closest('a, button, input, select, textarea, [role="button"]')) return;
    event.preventDefault();
    window.location.assign(href);
  };
  card.addEventListener('click', openDetail);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') openDetail(event);
  });
}

// Auto-apply LiquidGlass to every element with [data-glass]
const instances = new Map<HTMLElement, LiquidGlass>();
for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-glass]'))) {
  const raw = el.dataset.glass ?? '{}';
  let config: GlassConfig = {};
  try {
    config = JSON.parse(raw) as GlassConfig;
  } catch (e) {
    console.warn('Bad data-glass JSON on', el, e);
  }
  instances.set(el, new LiquidGlass(el, config));
}

// Dynamic Background Observer removed as requested

// Expose for ad-hoc debugging from devtools
declare global {
  interface Window {
    __liquidGlass: {
      instances: Map<HTMLElement, LiquidGlass>;
      LiquidGlass: typeof LiquidGlass;
    };
  }
}
window.__liquidGlass = { instances, LiquidGlass };

function hideLoadingScreen(): void {
  if (!loadingScreen) return;
  loadingScreen.classList.add('is-hidden');
  loadingScreen.setAttribute('aria-hidden', 'true');
  window.setTimeout(() => loadingScreen.remove(), 520);
}

const fontsReady =
  'fonts' in document
    ? (document as Document & { fonts: FontFaceSet }).fonts.ready.catch(() => undefined)
    : Promise.resolve();
const windowReady =
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
const minimumLoadingTime = new Promise<void>((resolve) => window.setTimeout(resolve, 920));

void Promise.all([fontsReady, windowReady, minimumLoadingTime]).finally(() => {
  requestAnimationFrame(hideLoadingScreen);
});
