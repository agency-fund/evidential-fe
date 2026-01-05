import { useMemo } from 'react';
import { Line } from 'recharts';
import { useRechartScales } from './use-chart-scales';

export interface Point {
  x: number;
  y: number;
}

export interface JitteredLineProps {
  points: Point[];
  color: string;
  dataKey: string;
  // No need for yDomain since the Line component will scale for us automatically based on dataKey
  xDomain: [number, number];
  jitterOffset?: number; // in plot area pixels
  strokeWidth?: number;
  opacity?: number;
}

/**
 * Renders a jittered line for a single arm using the Recharts Line component.
 * Transforms the data to achieve pixel-based jitter in the units of the XAxis.
 * Must use the same dataKey as the chart's XAxis.
 */
export function JitteredLine({
  points,
  color,
  dataKey,
  xDomain,
  jitterOffset = 0,
  strokeWidth = 2,
  opacity = 1,
}: JitteredLineProps) {
  const { plotWidth, isValid } = useRechartScales();

  // Build jittered path data - use useMemo since it's derived from props
  const lineData = useMemo(() => {
    if (!isValid || !plotWidth || !points.length) return [];

    // Avoid division by zero
    if (plotWidth <= 0) return [];

    // Calculate XAxis units per pixel to convert pixel jitter to the x-domain.
    const [minTime, maxTime] = xDomain;
    const unitsPerPixel = (maxTime - minTime) / plotWidth;
    const jitterAmount = jitterOffset * unitsPerPixel;

    // Construct the new jittered x values.
    return points
      .map((point) => {
        return {
          [dataKey]: point.x + jitterAmount,
          y: point.y,
        };
      })
      .filter((p): p is { [dataKey: string]: number; y: number } => !isNaN(p.y) && !isNaN(p[dataKey]));
  }, [isValid, plotWidth, points, dataKey, xDomain, jitterOffset]);

  if (!lineData.length) return null;

  return (
    <Line
      data={lineData}
      dataKey="y"
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
