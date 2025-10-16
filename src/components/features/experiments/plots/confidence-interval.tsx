import { TimeSeriesDataPoint } from '../forest-plot-utils';

export interface ConfidenceIntervalProps {
  xAxisMap?: Record<string, { scale: (value: string) => number }>;
  yAxisMap?: Record<string, { scale: (value: number) => number }>;
  chartData: TimeSeriesDataPoint[];
  armId: string;
  color: string;
  jitterOffset?: number; // jitter to prevent overlapping CIs in pixels
  strokeWidth?: number;
  capWidth?: number; // Width of the horizontal cap lines
  strokeLinecap?: 'round' | 'inherit' | 'butt' | 'square';
  opacity?: number;
  animationProgress?: number;
}

/**
 * Custom component to render confidence intervals for a single arm
 */
export function ConfidenceInterval({
  xAxisMap,
  yAxisMap,
  chartData,
  armId,
  color,
  jitterOffset = 0,
  strokeWidth = 3,
  capWidth = 0,
  strokeLinecap = 'round',
  opacity = 0.5,
  animationProgress = 1,
}: ConfidenceIntervalProps) {
  if (!xAxisMap || !yAxisMap || !chartData.length || !armId || !color) return null;
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
        const x = xAxis.scale(dataPoint.date) + jitterOffset;
        const yLower = yAxis.scale(armData.lower);
        const yUpper = yAxis.scale(armData.upper);

        // Each CI appears when the line reaches its position
        const totalPoints = chartData.length;
        const ciThreshold = totalPoints > 1 ? pointIndex / (totalPoints - 1) : 0;
        const currentOpacity = animationProgress >= ciThreshold ? opacity : 0;

        return (
          <g key={`ci-${armId}-${pointIndex}`} style={{ transition: 'opacity 0.15s ease-out' }}>
            {/* Vertical line from lower to upper CI */}
            <line
              x1={x}
              y1={yLower}
              x2={x}
              y2={yUpper}
              stroke={color}
              strokeWidth={strokeWidth}
              opacity={currentOpacity}
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
                opacity={currentOpacity}
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
                opacity={currentOpacity}
                strokeLinecap={strokeLinecap}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}
