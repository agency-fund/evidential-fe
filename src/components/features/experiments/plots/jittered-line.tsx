'use client';
import { useCallback, useMemo } from 'react';
import { ActiveDotProps, DotItemDotProps, Line } from 'recharts';
import { useRechartScales } from './use-chart-scales';

export interface JitteredLineData {
  x: number;
  y: number;
  id: string; // Unique identifier to pass back in onPointClick
}

// Internal processed point with jitter applied and the same x-axis dataKey
interface InternalProcessedPoint {
  [key: string]: number | string;
  y: number;
  id: string;
}

export interface DotConfig {
  r?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface JitteredLineProps {
  points: JitteredLineData[];
  dataKey: string;
  xDomain: [number, number];
  jitterOffset?: number; // in plot area pixels
  color: string;
  strokeWidth?: number;
  opacity?: number;
  // For legend/tooltip integration
  name?: string;
  // Dot configuration - set showDots to enable
  showDots?: boolean;
  dotConfig?: DotConfig;
  activeDotConfig?: DotConfig;
  // Click handler receives the point id
  onPointClick?: (pointId: string) => void;
}

/**
 * Renders a jittered line for a single arm using the Recharts Line component.
 * Transforms the data to achieve pixel-based jitter in the units of the XAxis.
 * Must provide the same dataKey as used by the parent chart's XAxis.
 *
 * When dots are enabled, they are automatically positioned at jittered coordinates
 * since the data itself is jittered - no additional offset needed for dots.
 */
export function JitteredLine({
  points,
  color,
  dataKey,
  xDomain,
  jitterOffset = 0,
  strokeWidth = 2,
  opacity = 1,
  name,
  showDots = false,
  dotConfig,
  activeDotConfig,
  onPointClick,
}: JitteredLineProps) {
  const { plotWidth, isValid } = useRechartScales();

  // Build line data with jitter applied when chart dimensions are available.
  // If chart dimensions aren't ready (isValid=false), render without jitter to avoid blank chart.
  const lineData = useMemo(() => {
    if (!points.length) return [];

    // Calculate jitter amount only when chart dimensions are valid
    let jitterAmount = 0;
    if (isValid && plotWidth > 0) {
      const [minTime, maxTime] = xDomain;
      const unitsPerPixel = (maxTime - minTime) / plotWidth;
      jitterAmount = jitterOffset * unitsPerPixel;
    }

    // Construct the jittered x values, preserving point id for click handlers.
    return points
      .map((point): InternalProcessedPoint | null => {
        const jitteredX = point.x + jitterAmount;
        if (isNaN(point.y) || isNaN(jitteredX)) return null;

        return {
          [dataKey]: jitteredX,
          y: point.y,
          id: point.id,
        };
      })
      .filter((p): p is InternalProcessedPoint => p !== null);
  }, [isValid, plotWidth, points, dataKey, xDomain, jitterOffset]);

  // Shared dot rendering logic. Returns null or a circle element.
  const renderDot = useCallback(
    (
      props: DotItemDotProps | ActiveDotProps,
      config: DotConfig | undefined,
      defaults: { r: number; strokeWidth: number },
    ) => {
      if (!showDots) return null;
      const { cx, cy, payload } = props as ActiveDotProps & { payload: InternalProcessedPoint };
      if (!payload || cx === undefined || cy === undefined) return null;

      return (
        <circle
          cx={cx}
          cy={cy}
          r={config?.r ?? defaults.r}
          fill={config?.fill ?? color}
          stroke={config?.stroke ?? color}
          strokeWidth={config?.strokeWidth ?? defaults.strokeWidth}
          opacity={opacity}
          style={{ cursor: onPointClick ? 'pointer' : undefined }}
          onClick={() => onPointClick?.(payload.id)}
        />
      );
    },
    [showDots, color, opacity, onPointClick],
  );

  // Stable callbacks that delegate to renderDot with appropriate config
  const dotElement = useCallback(
    (props: DotItemDotProps) => renderDot(props, dotConfig, { r: 3, strokeWidth: 1 }),
    [renderDot, dotConfig],
  );

  const activeDotElement = useCallback(
    (props: ActiveDotProps) => renderDot(props, activeDotConfig, { r: 5, strokeWidth: 2 }),
    [renderDot, activeDotConfig],
  );

  if (!lineData.length) return null;

  return (
    <Line
      data={lineData}
      dataKey="y"
      type="monotone"
      stroke={color}
      strokeWidth={strokeWidth}
      opacity={opacity}
      name={name}
      dot={showDots ? dotElement : false}
      activeDot={showDots ? activeDotElement : false}
      isAnimationActive={false}
      tooltipType="none"
      legendType={name ? 'line' : 'none'}
      connectNulls={false}
    />
  );
}
