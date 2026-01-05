import { useMemo } from 'react';
import { TimeSeriesDataPoint } from './forest-plot-utils';
import { useRechartScales } from './use-chart-scales';

export interface JitteredLineProps {
  chartData: TimeSeriesDataPoint[];
  armId: string;
  color: string;
  xDomain: [number, number];
  yDomain: [number, number];
  jitterOffset?: number;
  strokeWidth?: number;
  opacity?: number;
}

/**
 * Custom component to render a jittered line for a single arm
 */
export function JitteredLine({
  chartData,
  armId,
  color,
  jitterOffset = 0,
  strokeWidth = 2,
  opacity = 1,
}: JitteredLineProps) {
  const { scaleX, scaleY, isValid } = useRechartScales();

  // Build path data - use useMemo since it's derived from props
  const pathData = useMemo(() => {
    if (!isValid || !chartData.length) return '';

    // Build path from points with jitter applied
    const validPoints = chartData
      .map((dataPoint) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        const x = scaleX(dataPoint.dateTimestampMs) + jitterOffset;
        const y = scaleY(armData.absMean);

        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null && !isNaN(p.x) && !isNaN(p.y));

    if (validPoints.length < 2) return '';

    return validPoints
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(' ');
  }, [isValid, chartData, armId, jitterOffset, scaleX, scaleY]);

  if (!pathData) return null;

  return (
    <path
      d={pathData}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      pathLength={1}
      strokeDasharray="1"
      strokeDashoffset={0}
      opacity={opacity}
    />
  );
}
