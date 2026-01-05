import { useMemo } from 'react';
import { Line } from 'recharts';
import { TimeSeriesDataPoint } from './forest-plot-utils';
import { useRechartScales } from './use-chart-scales';
import { NumberDomain } from 'recharts/types/util/types';

export interface JitteredLineProps {
  chartData: TimeSeriesDataPoint[];
  armId: string;
  color: string;
  // No need for yDomain since the Line component will scale for us automatically based on dataKey
  xDomain: [number, number];
  jitterOffset?: number; // in plot area pixels
  strokeWidth?: number;
  opacity?: number;
}

/**
 * Custom component to render a jittered line for a single arm
 * Uses Recharts Line component with transformed data to achieve pixel-based jitter in a time-based axis
 */
export function JitteredLine({
  chartData,
  armId,
  color,
  xDomain,
  jitterOffset = 0,
  strokeWidth = 2,
  opacity = 1,
}: JitteredLineProps) {
  const { plotWidth, isValid } = useRechartScales();

  // Build jittered path data - use useMemo since it's derived from props
  const lineData = useMemo(() => {
    if (!isValid || !plotWidth || !chartData.length) return [];

    // Avoid division by zero
    if (plotWidth <= 0) return [];

    // Calculate milliseconds per pixel to convert pixel jitter to jitter in time units
    const [minTime, maxTime] = xDomain;
    const msPerPixel = (maxTime - minTime) / plotWidth;
    const jitterMs = jitterOffset * msPerPixel;

    // Construct the new jittered x values. Must retain the same dataKey used by the chart's XAxis.
    return chartData
      .map((dataPoint) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        return {
          dateTimestampMs: dataPoint.dateTimestampMs + jitterMs,
          value: armData.absMean,
        };
      })
      .filter(
        (p): p is { dateTimestampMs: number; value: number } =>
          p !== null && !isNaN(p.value) && !isNaN(p.dateTimestampMs),
      );
  }, [isValid, plotWidth, chartData, armId, xDomain, jitterOffset]);

  if (!lineData.length) return null;

  return (
    <Line
      data={lineData}
      dataKey="value"
      type="monotone"
      stroke={color}
      strokeWidth={strokeWidth}
      opacity={opacity}
      dot={false}
      activeDot={false}
      isAnimationActive={false}
      tooltipType="none"
      legendType="none"
      connectNulls={false}
    />
  );
}
