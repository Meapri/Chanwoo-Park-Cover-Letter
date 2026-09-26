import {
  bindGlassInteraction,
  resolveGlassSurface,
  type GlassInteraction,
  type GlassInteractionController,
  type GlassMaterial,
  type GlassSurfacePreset,
} from '@meapri/prism-glass';
import {
  createMediaGlass,
  type MediaGlassController,
  type MediaGlassDiagnostics,
  type MediaLens,
} from '@meapri/prism-glass/media';
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
  }, { variant: 'clear', appearance: 'light' });
  element.classList.remove('liquid-glass');
  element.classList.add('prism-material', 'prism-portfolio-surface');
  element.dataset.preset = preset;
  element.dataset.prismRenderer = element.parentElement?.closest('.prism-portfolio-surface') ? 'overlay' : 'pending';
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
  for (const selector of ['main', '.site-footer']) {
    const node = document.querySelector<HTMLElement>(selector);
    if (node) source.append(node);
  }
  return source;
}

function prepareMediaSource(): HTMLImageElement {
  const existing = document.querySelector<HTMLElement>('.scene-image');
  if (existing instanceof HTMLImageElement) return existing;

  const image = document.createElement('img');
  image.className = 'scene-image';
  image.alt = '';
  image.decoding = 'async';
  image.src = new URL('./assets/liquid-workstation.png', import.meta.url).href;
  existing?.replaceWith(image);
  return image;
}

function mountClearGlassScene(source: HTMLElement): MediaGlassController {
  const image = prepareMediaSource();
  const canvas = document.createElement('canvas');
  canvas.className = 'prism-page-media-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.querySelector('.background-scene')?.after(canvas);

  const surfaces = Array.from(
    document.querySelectorAll<HTMLElement>('.prism-portfolio-surface[data-prism-renderer="pending"]')
  );
  surfaces.forEach((element, index) => {
    element.dataset.prismLensId = `portfolio-${index + 1}`;
  });
  const interactions = new Map<HTMLElement, GlassInteraction>();
  const interactionControllers: GlassInteractionController[] = [];

  const readLenses = (): MediaLens[] => {
    const canvasBounds = canvas.getBoundingClientRect();
    const viewportWidth = canvasBounds.width;
    const viewportHeight = canvasBounds.height;
    return surfaces.flatMap((element): MediaLens[] => {
      const bounds = element.getBoundingClientRect();
      if (
        !bounds.width ||
        !bounds.height ||
        bounds.right <= 0 ||
        bounds.bottom <= 0 ||
        bounds.left >= viewportWidth ||
        bounds.top >= viewportHeight
      ) return [];

      const preset = (element.dataset.preset ?? presetFor(element)) as GlassSurfacePreset;
      const compact = bounds.height <= 96 && element.matches('.site-nav, a, button, li');
      const largeSurface = bounds.width * bounds.height >= 40_000;
      const resolved = resolveGlassSurface(preset, {
        width: bounds.width,
        height: bounds.height,
        shape: compact ? 'capsule' : 'continuous',
        radius: Math.max(1, Math.min(bounds.height / 2, Number.parseFloat(getComputedStyle(element).borderRadius) || 28)),
      }, { variant: 'clear', appearance: 'light' });
      const prominent = element.matches('.primary-action, .nav-action');
      const interaction = interactions.get(element);
      return [{
        id: element.dataset.prismLensId ?? preset,
        lens: {
          ...resolved.lens,
          x: bounds.left - canvasBounds.left,
          y: bounds.top - canvasBounds.top,
        },
        preset,
        variant: 'clear',
        appearance: 'light',
        tint: prominent ? [0.15, 0.38, 0.92, 0.13] : [1, 1, 1, 0.035],
        dimming: prominent ? 0.14 : 0.2,
        strength: largeSurface ? 28 : undefined,
        chroma: largeSurface ? 0.28 : 0.55,
        press: interaction?.press ?? 0,
        hover: interaction?.hover ?? 0,
        pointer: interaction?.pointer ?? [0.5, 0.5],
      }];
    });
  };

  const status = (diagnostics: MediaGlassDiagnostics): void => {
    canvas.dataset.prismState = diagnostics.state;
    canvas.dataset.prismReason = diagnostics.reason;
    source.dataset.prismState = diagnostics.state;
    const renderer = diagnostics.state === 'ready' ? 'webgl-media' : 'css-material';
    for (const element of surfaces) element.dataset.prismRenderer = renderer;
    const header = document.querySelector<HTMLElement>('.site-nav');
    if (header) {
      header.dataset.prismSourceState = diagnostics.state;
      header.dataset.prismSourceReason = diagnostics.reason;
    }
  };

  const controller = createMediaGlass(canvas, image, {
    lenses: readLenses(),
    fit: 'cover',
    sourceAlignment: 'element',
    resolution: 1024,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 3),
    maxPixels: 4_000_000,
    backgroundColor: [0.93, 0.96, 0.98],
    onStatus: status,
  });

  let frame = 0;
  const schedule = (): void => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      controller.setLenses(readLenses());
    });
  };
  const resize = new ResizeObserver(schedule);
  resize.observe(canvas);
  for (const element of surfaces) {
    resize.observe(element);
    interactionControllers.push(bindGlassInteraction(element, (interaction) => {
      interactions.set(element, interaction);
      schedule();
    }));
  }
  source.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  image.addEventListener('load', () => controller.refresh(), { once: true });

  window.addEventListener('beforeunload', () => {
    if (frame) window.cancelAnimationFrame(frame);
    resize.disconnect();
    for (const interaction of interactionControllers) interaction.destroy();
    source.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    controller.destroy();
  }, { once: true });

  return controller;
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

const viewportSource = createViewportSource();
restoreHashPosition();
const mediaGlass = mountClearGlassScene(viewportSource);

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
      source: HTMLImageElement;
      canvas: HTMLCanvasElement;
      media: MediaGlassController;
    };
  }
}
window.__prismGlass = {
  source: document.querySelector<HTMLImageElement>('.scene-image')!,
  canvas: document.querySelector<HTMLCanvasElement>('.prism-page-media-canvas')!,
  media: mediaGlass,
};

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
