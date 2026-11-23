import { afterEach, beforeEach, vi } from 'vitest';

/**
 * jsdom does no layout, so Recharts' ResponsiveContainer measures every chart as 0x0 and draws nothing.
 * Call this at the top of a test file to give each chart a fixed size: the ResponsiveContainer element
 * reports `width` x `height`, and a ResizeObserver reports the same. Recharts then lays the chart out for
 * real at that size, so tests can compare marks with each other, though the positions are not what a
 * browser would show.
 *
 * Every other element keeps jsdom's 0x0 size. Recharts measures tick labels with getBoundingClientRect,
 * and labels as large as the chart would look like they overlap, so it would hide all but one tick.
 */
export function stubChartLayout(width = 900, height = 400) {
  beforeEach(() => {
    const measure = Element.prototype.getBoundingClientRect;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe(target: Element) {
          const entry = { target, contentRect: { width, height } } as ResizeObserverEntry;
          this.callback([entry], this as unknown as ResizeObserver);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (!this.classList.contains('recharts-responsive-container')) {
        return measure.call(this);
      }
      return { width, height, x: 0, y: 0, top: 0, left: 0, right: width, bottom: height, toJSON: () => ({}) };
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
}
