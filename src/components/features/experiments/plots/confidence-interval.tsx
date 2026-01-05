import { Significance, TimeSeriesDataPoint, getColorWithSignificance } from './forest-plot-utils';
import { useRechartScales } from './use-chart-scales';

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
  baseColor,
  jitterOffset = 0,
  strokeWidth = 5,
  capWidth = 0,
  strokeLinecap = 'round',
  opacity = 1,
  onClick,
}: ConfidenceIntervalProps) {
  const { scaleX, scaleY, isValid } = useRechartScales();

  if (!isValid || !chartData.length) return null;

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

        if (isNaN(x) || isNaN(yLower) || isNaN(yUpper)) return null;

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
