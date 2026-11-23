import { useCallback } from 'react';
import { AxisId, useXAxisScale, useYAxisScale } from 'recharts';

/** Maps a data value to a pixel coordinate along one axis of the enclosing Recharts chart. */
export type PixelScale = (value: unknown) => number;

/**
 * Wraps a Recharts scale function for drawing point marks (dots, CI bars) inside a chart:
 * - On band (category) axes, a value maps to the middle of its band, where Scatter and Line draw
 *   their points. Numeric and point scales have no band width, so this does not affect them.
 * - A value the axis can't place, or any value before the chart is laid out, maps to NaN.
 *
 * Marks positioned relative to bars should call Recharts' useXAxisScale/useYAxisScale directly,
 * with the band position they need.
 */
function usePixelScale(scale: ReturnType<typeof useXAxisScale>): PixelScale {
  // Recharts memoizes its scales, so this only changes when the axis does.
  return useCallback((value: unknown) => scale?.(value, { position: 'middle' }) ?? NaN, [scale]);
}

/** Returns a PixelScale for the XAxis with the given id (Recharts' default axis if omitted). */
export const useScaleX = (xAxisId?: AxisId): PixelScale => usePixelScale(useXAxisScale(xAxisId));

/** Returns a PixelScale for the YAxis with the given id (Recharts' default axis if omitted). */
export const useScaleY = (yAxisId?: AxisId): PixelScale => usePixelScale(useYAxisScale(yAxisId));
