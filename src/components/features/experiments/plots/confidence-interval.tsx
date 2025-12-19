import { useChartHeight, useChartWidth, useOffset } from 'recharts';
import { Significance, TimeSeriesDataPoint, getColorWithSignificance } from './forest-plot-utils';

export interface ConfidenceIntervalProps {
  chartData: TimeSeriesDataPoint[];
  armId: string;
  selected: boolean;
  baseColor: string;
  xDomain: [number, number];
  yDomain: [number, number];
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
  xDomain,
  yDomain,
  jitterOffset = 0,
  strokeWidth = 5,
  capWidth = 0,
  strokeLinecap = 'round',
  opacity = 1,
  onClick,
}: ConfidenceIntervalProps) {
  const offset = useOffset();
  const chartWidth = useChartWidth();
  const chartHeight = useChartHeight();

  if (!offset || !chartWidth || !chartHeight || !chartData.length) return null;

  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;
  if (xMax - xMin === 0 || yMax - yMin === 0) return null;

  const plotLeft = offset.left ?? 0;
  const plotTop = offset.top ?? 0;
  const plotWidth = chartWidth - plotLeft - (offset.right ?? 0);
  const plotHeight = chartHeight - plotTop - (offset.bottom ?? 0);
  if (plotWidth <= 0 || plotHeight <= 0) return null;

  const scaleX = (x: number) => plotLeft + ((x - xMin) / (xMax - xMin)) * plotWidth + jitterOffset;
  const scaleY = (y: number) => plotTop + plotHeight - ((y - yMin) / (yMax - yMin)) * plotHeight;

  // Render confidence intervals for this arm at each data point
  return (
    <g>
      {chartData.map((dataPoint, pointIndex) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        // Rescale the x and y values to the pixel coordinates
        const x = scaleX(dataPoint.dateTimestampMs);
        const yLower = scaleY(armData.lowerCI);
        const yUpper = scaleY(armData.upperCI);
        const color = getColorWithSignificance(baseColor, Significance.No, selected);

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
