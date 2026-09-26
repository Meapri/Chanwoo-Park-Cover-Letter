import {
  createGlass,
  resolveGlassSurface,
  type GlassController,
  type GlassDiagnostics,
  type GlassMaterial,
  type GlassSurfacePreset,
} from '@meapri/prism-glass';
import '@meapri/prism-glass/styles.css';
import {
  EN_TRANSLATIONS,
  LANGUAGE_STORAGE_KEY,
  TRANSLATABLE_ATTRIBUTES,
  type SupportedLanguage,
} from './i18n';

const loadingScreen = document.querySelector<HTMLElement>('[data-loading-screen]');
const loadingStatus = loadingScreen?.querySelector<HTMLElement>('[data-loading-status]');

if (loadingStatus) {
  loadingStatus.textContent = 'Prism Glass 렌더링 준비 중';
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

const rgba = ([red, green, blue, alpha]: readonly number[]): string =>
  `rgb(${Math.round(red * 255)} ${Math.round(green * 255)} ${Math.round(blue * 255)} / ${alpha})`;

function presetFor(element: HTMLElement): GlassSurfacePreset {
  if (element.matches('.site-nav')) return 'navigation';
  if (element.matches('.stack-cloud li, .tag-row li')) return 'chip';
  if (element.matches('a, button, .project-detail-link, .detail-action')) return 'button';
  if (element.matches('.intro-strip')) return 'toolbar';
  if (element.matches('.hero-panel, .project-detail-card, .contact-section')) return 'sheet';
  if (element.matches('.project-card, .evidence-panel, .capability-grid')) return 'popover';
  return 'popover';
}

function writeMaterial(element: HTMLElement, material: GlassMaterial, elevation: number): void {
  const prominent = element.matches('.primary-action, .nav-action');
  element.style.setProperty('--prism-fill', prominent ? 'rgb(37 99 235 / .54)' : rgba(material.tint));
  element.style.setProperty('--prism-solid', prominent ? '#2563eb' : material.opaque);
  element.style.setProperty('--prism-ink', prominent ? '#ffffff' : material.foreground);
  element.style.setProperty('--prism-rim', `rgb(255 255 255 / ${Math.max(0.2, material.highlight)})`);
  element.style.setProperty('--prism-elevation', String(elevation));
  element.dataset.appearance = material.appearance;
  element.dataset.variant = material.variant;
}

function applyMaterialSurface(element: HTMLElement, preset = presetFor(element)): void {
  const bounds = element.getBoundingClientRect();
  const resolved = resolveGlassSurface(preset, {
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height),
    radius: Math.max(1, Math.min(bounds.height / 2, Number.parseFloat(getComputedStyle(element).borderRadius) || 28)),
  });
  element.classList.remove('liquid-glass');
  element.classList.add('prism-material', 'prism-portfolio-surface');
  element.dataset.preset = preset;
  element.dataset.prismRenderer ||= 'css-material';
  writeMaterial(element, resolved.material, resolved.elevation);
  if (!element.querySelector(':scope > .prism-lens')) {
    const lens = document.createElement('span');
    lens.className = 'prism-lens';
    lens.setAttribute('aria-hidden', 'true');
    element.prepend(lens);
  }
}

for (const element of Array.from(document.querySelectorAll<HTMLElement>('[data-prism-surface]'))) {
  applyMaterialSurface(element);
}

for (const element of Array.from(
  document.querySelectorAll<HTMLElement>('.nav-action, .language-toggle, .hero-actions .secondary-action, .detail-back-link, .stack-cloud li')
)) {
  applyMaterialSurface(element);
}

function createViewportSource(): HTMLElement {
  const header = document.querySelector<HTMLElement>('.site-nav');
  if (!header) throw new Error('The portfolio header is required');
  const source = document.createElement('div');
  source.className = 'prism-scroll-source';
  source.dataset.prismSource = 'viewport';
  header.before(source);
  for (const selector of ['.background-scene', 'main', '.site-footer']) {
    const node = document.querySelector<HTMLElement>(selector);
    if (node) source.append(node);
  }
  return source;
}

function restoreHashPosition(): void {
  const scrollToHash = (): void => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ block: 'start' });
  };
  for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))) {
    link.addEventListener('click', (event) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const target = id ? document.getElementById(id) : null;
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', link.hash);
    });
  }
  window.addEventListener('hashchange', scrollToHash);
  requestAnimationFrame(scrollToHash);
}

function mountHeaderRefraction(source: HTMLElement): GlassController {
  const header = document.querySelector<HTMLElement>('.site-nav');
  if (!header) throw new Error('The portfolio header is required');
  applyMaterialSurface(header, 'navigation');

  const readSurface = () => {
    const headerBounds = header.getBoundingClientRect();
    const sourceBounds = source.getBoundingClientRect();
    return resolveGlassSurface('navigation', {
      x: headerBounds.left - sourceBounds.left,
      y: headerBounds.top - sourceBounds.top,
      width: headerBounds.width,
      height: headerBounds.height,
      shape: 'capsule',
      radius: headerBounds.height / 2,
    });
  };
  const first = readSurface();
  writeMaterial(header, first.material, first.elevation);
  const status = (diagnostics: GlassDiagnostics): void => {
    header.dataset.prismSourceState = diagnostics.state;
    header.dataset.prismSourceReason = diagnostics.reason;
    source.dataset.prismState = diagnostics.state;
    if (diagnostics.state === 'ready') header.dataset.prismRenderer = diagnostics.renderer;
    else header.dataset.prismRenderer = 'css-material';
  };
  const controller = createGlass(source, {
    ...first.optics,
    resolution: 512,
    maxSourcePixels: 16_000_000,
    onStatus: status,
  });
  const updateGeometry = (): void => {
    const next = readSurface();
    writeMaterial(header, next.material, next.elevation);
    controller.update(next.optics);
  };
  const resize = new ResizeObserver(updateGeometry);
  resize.observe(header);
  resize.observe(source);

  window.addEventListener('beforeunload', () => {
    resize.disconnect();
    controller.destroy();
  }, { once: true });
  return controller;
}

const viewportSource = createViewportSource();
restoreHashPosition();
const headerGlass = mountHeaderRefraction(viewportSource);

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

declare global {
  interface Window {
    __prismGlass: {
      source: HTMLElement;
      header: GlassController;
    };
  }
}
window.__prismGlass = { source: viewportSource, header: headerGlass };

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
