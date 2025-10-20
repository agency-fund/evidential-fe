import { TimeSeriesDataPoint } from './forest-plot-utils';

export interface JitteredDotProps {
  cx: number;
  cy: number;
  payload: TimeSeriesDataPoint; // original TimeSeriesDatPoint passed to the Line
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  r?: number;
  jitterOffset?: number;
  opacity?: number;
}

/**
 * Custom dot component for Line that applies jitter
 */
export function JitteredDot({
  cx,
  cy,
  fill,
  stroke,
  strokeWidth,
  r = 4,
  jitterOffset = 0,
  opacity = 1,
}: JitteredDotProps) {
  if (cx === undefined || cy === undefined) return null;

  return (
    <circle
      cx={cx + jitterOffset}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      style={{ transition: 'opacity 0.15s ease-out' }}
    />
  );
}
