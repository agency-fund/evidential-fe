import { useMemo } from 'react';
import { TimeSeriesDataPoint } from './forest-plot-utils';

export interface JitteredLineProps {
  xAxisMap?: Record<string, { scale: (value: number) => number }>;
  yAxisMap?: Record<string, { scale: (value: number) => number }>;
  chartData: TimeSeriesDataPoint[];
  armId: string;
  color: string;
  jitterOffset?: number;
  strokeWidth?: number;
  opacity?: number;
}

/**
 * Custom component to render a jittered line for a single arm
 */
export function JitteredLine({
  xAxisMap,
  yAxisMap,
  chartData,
  armId,
  color,
  jitterOffset = 0,
  strokeWidth = 2,
  opacity = 1,
}: JitteredLineProps) {
  // Build path data - use useMemo since it's derived from props
  const pathData = useMemo(() => {
    if (!xAxisMap || !yAxisMap || !chartData.length || !armId) return '';

    const xAxis = Object.values(xAxisMap)[0];
    const yAxis = Object.values(yAxisMap)[0];

    // Build path from points with jitter applied
    const validPoints = chartData
      .map((dataPoint) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        const x = xAxis.scale(dataPoint.dateTimestampMs) + jitterOffset;
        const y = yAxis.scale(armData.estimate);

        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (validPoints.length < 2) return '';

    return validPoints
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(' ');
  }, [xAxisMap, yAxisMap, chartData, armId, jitterOffset]);

  if (!pathData) return null;

  return (
    <path
      d={pathData}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={0}
      opacity={opacity}
    />
  );
}
