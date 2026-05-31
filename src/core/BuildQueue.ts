/**
 * Time-sliced build scheduler for expensive glass map generation.
 *
 * Displacement and specular maps are the only blocking part of the engine. A
 * page with many glass surfaces should not build every map in one synchronous
 * burst, so each element enqueues its initial build and the queue drains within
 * a small per-frame budget.
 */

const queue: Array<() => void> = [];
let scheduled = false;

const SLICE_MS = 6;

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function schedule(): void {
  if (scheduled) return;
  scheduled = true;
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => pump(), { timeout: 250 });
  } else if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => pump());
  } else {
    setTimeout(pump, 16);
  }
}

function pump(): void {
  scheduled = false;
  const start = nowMs();
  do {
    const task = queue.shift();
    if (!task) break;
    try {
      task();
    } catch (error) {
      console.warn('[liquid-glass] queued build failed', error);
    }
  } while (queue.length && nowMs() - start < SLICE_MS);
  if (queue.length) schedule();
}

export function enqueueBuild(task: () => void): () => void {
  queue.push(task);
  schedule();
  return () => {
    const index = queue.indexOf(task);
    if (index >= 0) queue.splice(index, 1);
  };
}
