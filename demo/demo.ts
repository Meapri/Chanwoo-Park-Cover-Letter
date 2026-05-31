import { LiquidGlass, LiquidInteractive } from '../src';
import type { LiquidGlassOptions } from '../src';

interface GlassConfig extends LiquidGlassOptions {}

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

// Initialize Interactive Elements
document.querySelectorAll('.lg-interactive').forEach(el => {
  new LiquidInteractive(el as HTMLElement, {
    rotation: 5,
    smoothing: 0.18,
    hoverScale: 1.015,
    pressScaleX: 1.025,
    pressScaleY: 0.94,
  });
});

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
