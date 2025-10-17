export interface JitteredDotProps {
  cx?: number;
  cy?: number;
  r?: number;
  fill?: string;
  stroke?: string;
  jitterOffset?: number;
  index?: number;
  totalPoints?: number;
  animationProgress?: number;
}

/**
 * Custom dot component for Line that applies jitter
 */
export function JitteredDot({
  cx,
  cy,
  r = 4,
  fill,
  stroke,
  jitterOffset = 0,
  index = 0,
  totalPoints = 1,
  animationProgress = 1,
}: JitteredDotProps) {
  if (cx === undefined || cy === undefined) return null;

  // Calculate if this dot should be visible based on animation progress
  // Dot appears when the line reaches its position (index / (totalPoints - 1))
  // For a single point, show immediately.
  const dotThreshold = totalPoints > 1 ? index / (totalPoints - 1) : 0;
  const opacity = animationProgress >= dotThreshold ? 1 : 0;

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
