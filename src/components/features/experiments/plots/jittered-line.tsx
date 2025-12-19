import { useMemo } from 'react';
import { useChartHeight, useChartWidth, useOffset } from 'recharts';
import { TimeSeriesDataPoint } from './forest-plot-utils';

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
  xDomain,
  yDomain,
  jitterOffset = 0,
  strokeWidth = 2,
  opacity = 1,
}: JitteredLineProps) {
  const offset = useOffset();
  const chartWidth = useChartWidth();
  const chartHeight = useChartHeight();

  // Build path data - use useMemo since it's derived from props
  const pathData = useMemo(() => {
    if (!offset || !chartWidth || !chartHeight || !chartData.length || !armId) return '';

    const [xMin, xMax] = xDomain;
    const [yMin, yMax] = yDomain;
    if (xMax - xMin === 0 || yMax - yMin === 0) return '';

    const plotLeft = offset.left ?? 0;
    const plotTop = offset.top ?? 0;
    const plotWidth = chartWidth - plotLeft - (offset.right ?? 0);
    const plotHeight = chartHeight - plotTop - (offset.bottom ?? 0);
    if (plotWidth <= 0 || plotHeight <= 0) return '';

    const scaleX = (x: number) => plotLeft + ((x - xMin) / (xMax - xMin)) * plotWidth + jitterOffset;
    const scaleY = (y: number) => plotTop + plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

    // Build path from points with jitter applied
    const validPoints = chartData
      .map((dataPoint) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        const x = scaleX(dataPoint.dateTimestampMs);
        const y = scaleY(armData.absMean);

        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (validPoints.length < 2) return '';

    return validPoints
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(' ');
  }, [offset, chartWidth, chartHeight, chartData, armId, jitterOffset, xDomain, yDomain]);

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
