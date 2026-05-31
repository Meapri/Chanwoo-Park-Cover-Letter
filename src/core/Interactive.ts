/**
 * Spatial interaction for `.lg-interactive` glass — the motion half of Liquid
 * Glass, which Apple designed together with the look: it "responds to
 * interaction by instantly flexing and energizing with light … it comes to life
 * on touch" (Meet Liquid Glass, WWDC25).
 *
 * This drives the 3D parallax tilt from the hover position (`--lg-tilt-x/y`).
 * The jelly "flex" squish is pure CSS (:active).
 *
 * The pointer-tracked EDGE light, proximity glow AND the press interaction
 * illumination (which spreads onto nearby glass) are owned by the core
 * `PointerField`; this class only adds the per-element tilt.
 * Honors `prefers-reduced-motion` by dropping the elastic tilt.
 */
export class LiquidInteractive {
  private static readonly DEFAULTS: Required<LiquidInteractiveOptions> = {
    rotation: 20,
    smoothing: 0.15,
    perspective: 1200,
    hoverLift: -2,
    hoverScale: 1.02,
    pressLift: 2,
    pressScaleX: 1.03,
    pressScaleY: 0.92,
  };

  /**
   * Attach spatial interaction to every element matching `selector`
   * (default `.lg-interactive`). Returns the created instances.
   */
  static initAll(
    selector = '.lg-interactive',
    options: LiquidInteractiveOptions = {}
  ): LiquidInteractive[] {
    return Array.from(document.querySelectorAll<HTMLElement>(selector)).map(
      (el) => new LiquidInteractive(el, options)
    );
  }

  private element: HTMLElement;
  private options: Required<LiquidInteractiveOptions>;
  private rafId: number | null = null;
  private isHovered = false;
  private reduceMotion = false;

  // Smoothing states for fluid tilt.
  private targetX = 0.5;
  private targetY = 0.5;
  private currentX = 0.5;
  private currentY = 0.5;

  constructor(element: HTMLElement, options: LiquidInteractiveOptions = {}) {
    this.element = element;
    this.options = { ...LiquidInteractive.DEFAULTS, ...options };
    this.reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Pointer events cover both mouse and touch (so press illumination works on
    // touch devices, where there is no hover).
    element.addEventListener('pointerenter', this.onEnter);
    element.addEventListener('pointermove', this.onMove);
    element.addEventListener('pointerleave', this.onLeave);

    element.style.setProperty('--lg-tilt-x', '0deg');
    element.style.setProperty('--lg-tilt-y', '0deg');
    element.style.setProperty('--lg-perspective', `${this.options.perspective}px`);
    element.style.setProperty('--lg-hover-lift', `${this.options.hoverLift}px`);
    element.style.setProperty('--lg-hover-scale', String(this.options.hoverScale));
    element.style.setProperty('--lg-press-lift', `${this.options.pressLift}px`);
    element.style.setProperty('--lg-press-scale-x', String(this.options.pressScaleX));
    element.style.setProperty('--lg-press-scale-y', String(this.options.pressScaleY));
  }

  // ── Hover: 3D parallax tilt ──────────────────────────────────────────────
  private onEnter = (): void => {
    this.isHovered = true;
    if (!this.reduceMotion && this.rafId === null) this.loop();
  };

  private onLeave = (): void => {
    this.isHovered = false;
    this.targetX = 0.5;
    this.targetY = 0.5;
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.isHovered || this.reduceMotion) return;
    const rect = this.element.getBoundingClientRect();
    this.targetX = (e.clientX - rect.left) / rect.width;
    this.targetY = (e.clientY - rect.top) / rect.height;
  };

  private loop = (): void => {
    this.currentX += (this.targetX - this.currentX) * this.options.smoothing;
    this.currentY += (this.targetY - this.currentY) * this.options.smoothing;

    const tiltX = (0.5 - this.currentY) * this.options.rotation;
    const tiltY = (this.currentX - 0.5) * this.options.rotation;
    this.element.style.setProperty('--lg-tilt-x', `${tiltX.toFixed(2)}deg`);
    this.element.style.setProperty('--lg-tilt-y', `${tiltY.toFixed(2)}deg`);

    if (
      !this.isHovered &&
      Math.abs(this.targetX - this.currentX) < 0.001 &&
      Math.abs(this.targetY - this.currentY) < 0.001
    ) {
      this.rafId = null;
      this.element.style.setProperty('--lg-tilt-x', '0deg');
      this.element.style.setProperty('--lg-tilt-y', '0deg');
      return;
    }
    this.rafId = requestAnimationFrame(this.loop);
  };

  destroy(): void {
    this.element.removeEventListener('pointerenter', this.onEnter);
    this.element.removeEventListener('pointermove', this.onMove);
    this.element.removeEventListener('pointerleave', this.onLeave);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }
}

export interface LiquidInteractiveOptions {
  /** Maximum tilt in degrees at the element edge. Default: 20. */
  rotation?: number;
  /** Pointer-follow smoothing factor. Higher values feel snappier. Default: 0.15. */
  smoothing?: number;
  /** CSS perspective depth in px. Default: 1200. */
  perspective?: number;
  /** Hover translation in px. Negative lifts the glass. Default: -2. */
  hoverLift?: number;
  /** Hover scale. Default: 1.02. */
  hoverScale?: number;
  /** Press translation in px. Default: 2. */
  pressLift?: number;
  /** Press x-axis squash/stretch scale. Default: 1.03. */
  pressScaleX?: number;
  /** Press y-axis squash/stretch scale. Default: 0.92. */
  pressScaleY?: number;
}
