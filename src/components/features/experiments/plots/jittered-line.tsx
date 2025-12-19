import { useMemo } from 'react';
import { useChartHeight, useChartWidth, useOffset, useXAxisDomain, useYAxisDomain } from 'recharts';
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
  jitterOffset = 0,
  strokeWidth = 2,
  opacity = 1,
}: JitteredLineProps) {
  // Get information from recharts in order to scale plots appropriately:
  //
  // Offsets: distances from chart edges to the edges of the plot area, including margins, axes, legend, brush height.
  const offset = useOffset();
  // Width and height: size of the chart including the axes and legend.
  const chartWidth = useChartWidth();
  const chartHeight = useChartHeight();
  // Numeric domains: array of min and max; Categorical: array of categories, or indices if duplicates exist.
  const xAxisDomain = useXAxisDomain();
  const yAxisDomain = useYAxisDomain();

  // Build path data - use useMemo since it's derived from props
  const pathData = useMemo(() => {
    if (!offset || !chartWidth || !chartHeight || !xAxisDomain || !yAxisDomain || !chartData.length) return '';

    const xMin = xAxisDomain[0];
    const xMax = xAxisDomain[xAxisDomain.length - 1];
    const yMin = yAxisDomain[0];
    const yMax = yAxisDomain[yAxisDomain.length - 1];

    const [plotLeft, plotRight] = [offset.left ?? 0, offset.right ?? 0];
    const [plotTop, plotBottom] = [offset.top ?? 0, offset.bottom ?? 0];
    const plotWidth = chartWidth - plotLeft - plotRight;
    const plotHeight = chartHeight - plotTop - plotBottom;
    if (plotWidth <= 0 || plotHeight <= 0) return null;

    const scaleX = (x: number) => {
      if (typeof xMin !== 'number' || typeof xMax !== 'number') return NaN;
      if (xMin === xMax) return plotLeft + plotWidth / 2; // one point only so plot in the middle
      return plotLeft + ((x - xMin) / (xMax - xMin)) * plotWidth;
    };
    const scaleY = (y: number) => {
      if (typeof yMin !== 'number' || typeof yMax !== 'number') return NaN;
      // Plotting from the top left of the chart:
      if (yMin === yMax) return plotTop + plotHeight / 2;
      return plotTop + ((yMax - y) / (yMax - yMin)) * plotHeight;
    };

    // Build path from points with jitter applied
    const validPoints = chartData
      .map((dataPoint) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        const x = scaleX(dataPoint.dateTimestampMs) + jitterOffset;
        const y = scaleY(armData.absMean);

        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (validPoints.length < 2) return '';

    return validPoints
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(' ');
  }, [offset, chartWidth, chartHeight, xAxisDomain, yAxisDomain, chartData, armId, jitterOffset]);

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
