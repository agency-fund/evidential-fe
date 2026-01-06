import { useRechartScales } from './use-chart-scales';

export interface HorizontalConfidenceIntervalProps {
  lower: number;
  upper: number;
  armName: string;
  strokeColor: string;
  strokeWidth?: number;
  capHeight?: number; // Height of the vertical cap lines
  opacity?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  yAxisId?: string | number;
  xAxisId?: string | number;
}

/**
 * Renders horizontal confidence intervals for forest plots.
 * Assumes the Y axis is categorical and the X axis is numeric.
 */
export function HorizontalConfidenceInterval({
  lower,
  upper,
  armName,
  strokeColor,
  strokeWidth = 12,
  capHeight = 0,
  opacity = 1,
  onMouseEnter,
  onMouseLeave,
  yAxisId,
  xAxisId,
}: HorizontalConfidenceIntervalProps) {
  const { scaleX, scaleCategoricalY, isValid } = useRechartScales({ xAxisId, yAxisId });

  if (!isValid) return null;

  const xLower = scaleX(lower);
  const xUpper = scaleX(upper);
  const y = scaleCategoricalY(armName);

  if (isNaN(xLower) || isNaN(xUpper) || isNaN(y)) return null;

  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {/* Horizontal line from lower to upper CI */}
      <line
        x1={xLower}
        y1={y}
        x2={xUpper}
        y2={y}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={opacity}
      />
      {/* Left cap */}
      {capHeight > 0 && (
        <line
          x1={xLower}
          y1={y - capHeight / 2}
          x2={xLower}
          y2={y + capHeight / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={opacity}
        />
      )}
      {/* Right cap */}
      {capHeight > 0 && (
        <line
          x1={xUpper}
          y1={y - capHeight / 2}
          x2={xUpper}
          y2={y + capHeight / 2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={opacity}
        />
      )}
    </g>
  );
}
