import { TimeSeriesDataPoint, getColorWithSignificance } from './forest-plot-utils';

export interface ConfidenceIntervalProps {
  xAxisMap?: Record<string, { scale: (value: number) => number }>;
  yAxisMap?: Record<string, { scale: (value: number) => number }>;
  chartData: TimeSeriesDataPoint[];
  armId: string;
  selected: boolean;
  baseColor: string;
  jitterOffset?: number; // jitter to prevent overlapping CIs in pixels
  strokeWidth?: number;
  capWidth?: number; // Width of the horizontal cap lines
  strokeLinecap?: 'round' | 'inherit' | 'butt' | 'square';
  opacity?: number;
}

/**
 * Custom component to render confidence intervals for a single arm
 */
export function ConfidenceInterval({
  xAxisMap,
  yAxisMap,
  chartData,
  armId,
  selected,
  baseColor,
  jitterOffset = 0,
  strokeWidth = 3,
  capWidth = 0,
  strokeLinecap = 'round',
  opacity = 1,
}: ConfidenceIntervalProps) {
  if (!xAxisMap || !yAxisMap || !chartData.length) return null;
  // These params are special internal params for recharts.
  // TODO: update to recharts 3+ API to replace magic with hooks.
  const xAxis = Object.values(xAxisMap)[0];
  const yAxis = Object.values(yAxisMap)[0];

  // Render confidence intervals for this arm at each data point
  return (
    <g>
      {chartData.map((dataPoint, pointIndex) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        // Rescale the x and y values to the pixel coordinates
        const x = xAxis.scale(dataPoint.dateTimestampMs) + jitterOffset;
        const yLower = yAxis.scale(armData.lower);
        const yUpper = yAxis.scale(armData.upper);
        const color = getColorWithSignificance(baseColor, armData.significant, armData.estimate > 0, selected);

        return (
          <g key={`ci-${armId}-${pointIndex}`}>
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
