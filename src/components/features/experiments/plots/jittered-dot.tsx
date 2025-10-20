export interface JitteredDotProps {
  cx?: number;
  cy?: number;
  r?: number;
  fill?: string;
  stroke?: string;
  jitterOffset?: number;
  opacity?: number;
}

/**
 * Custom dot component for Line that applies jitter
 */
export function JitteredDot({ cx, cy, r = 4, fill, stroke, jitterOffset = 0, opacity = 1 }: JitteredDotProps) {
  if (cx === undefined || cy === undefined) return null;

  return (
    <circle
      cx={cx + jitterOffset}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={0}
      opacity={opacity}
      style={{ transition: 'opacity 0.15s ease-out' }}
    />
  );
}
