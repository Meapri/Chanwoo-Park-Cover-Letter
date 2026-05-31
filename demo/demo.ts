import { LiquidGlass } from '../src';
import type { LiquidGlassOptions } from '../src';

interface GlassConfig extends LiquidGlassOptions {}

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

for (const el of Array.from(document.querySelectorAll<HTMLElement>('.nav-action, .hero-actions .secondary-action, .detail-back-link'))) {
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
