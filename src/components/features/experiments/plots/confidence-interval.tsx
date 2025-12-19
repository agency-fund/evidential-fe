import { useChartHeight, useChartWidth, useOffset, useXAxisDomain, useYAxisDomain } from 'recharts';
import { Significance, TimeSeriesDataPoint, getColorWithSignificance } from './forest-plot-utils';

export interface ConfidenceIntervalProps {
  chartData: TimeSeriesDataPoint[];
  armId: string;
  selected: boolean;
  baseColor: string;
  jitterOffset?: number; // jitter to prevent overlapping CIs in pixels
  strokeWidth?: number;
  capWidth?: number; // Width of the horizontal cap lines
  strokeLinecap?: 'round' | 'inherit' | 'butt' | 'square';
  opacity?: number;
  onClick?: (dataPoint: TimeSeriesDataPoint) => void;
}

/**
 * Custom component to render confidence intervals for a single arm
 */
export function ConfidenceInterval({
  chartData,
  armId,
  selected,
  baseColor,
  jitterOffset = 0,
  strokeWidth = 5,
  capWidth = 0,
  strokeLinecap = 'round',
  opacity = 1,
  onClick,
}: ConfidenceIntervalProps) {
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
  if (!offset || !chartWidth || !chartHeight || !xAxisDomain || !yAxisDomain || !chartData.length) return null;

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

  // Render confidence intervals for this arm at each data point
  return (
    <g>
      {chartData.map((dataPoint, pointIndex) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        // Rescale the x and y values to the pixel coordinates
        const x = scaleX(dataPoint.dateTimestampMs) + jitterOffset;
        const yLower = scaleY(armData.lowerCI);
        const yUpper = scaleY(armData.upperCI);
        const color = getColorWithSignificance(baseColor, Significance.No, false);

        return (
          <g
            key={`ci-${armId}-${pointIndex}`}
            onClick={() => onClick?.(dataPoint)}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
          >
            {/* Vertical line from lower to upper CI */}
            <line
              x1={x}
              y1={yLower}
              x2={x}
              y2={yUpper}
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={opacity}
              strokeLinecap={strokeLinecap}
            />
            {/* Upper cap */}
            {capWidth > 0 && (
              <line
                x1={x - capWidth / 2}
                y1={yUpper}
                x2={x + capWidth / 2}
                y2={yUpper}
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeLinecap={strokeLinecap}
              />
            )}
            {/* Lower cap */}
            {capWidth > 0 && (
              <line
                x1={x - capWidth / 2}
                y1={yLower}
                x2={x + capWidth / 2}
                y2={yLower}
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeLinecap={strokeLinecap}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
