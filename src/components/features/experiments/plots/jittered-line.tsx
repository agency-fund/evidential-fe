'use client';
import { useCallback, useMemo } from 'react';
import { ActiveDotProps, DotItemDotProps, Line } from 'recharts';
import { useRechartScales } from './use-chart-scales';

export interface JitteredLineInputData<T> {
  x: number;
  y: number;
  userPayload: T; // arbitrary data to pass back in onPointClick
}

/**
 * Processed input data point with jitter applied, using JitteredLineProps.dataKey for the x key.
 * This is used by the Recharts Line component that we wrap, and therefore can show up as e.g. the
 * payload in a Tooltip.
 *
 * NOTE: the dynamic x-axis key (from dataKey prop) is added at runtime.
 */
export interface JitteredLinePayloadData<T> {
  [key: string]: number | T;
  y: number;
  userPayload: T;
}

export interface DotConfig {
  r?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface JitteredLineProps<T> {
  data: JitteredLineInputData<T>[];
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
  // Click handler receives the userPayload
  onPointClick?: (userPayload: T) => void;
}

/**
 * Generic Recharts component that renders a jittered line for a single data series, wrapping a
 * Recharts Line component. Transforms the data to achieve pixel-based jitter in the units of the
 * XAxis. If the xDomain width is 0 (a single point), no jitter is applied.
 * Must provide the same dataKey as used by the parent chart's XAxis.
 *
 * When dots are enabled, they are automatically positioned at jittered coordinates
 * since the data itself is jittered - no additional offset needed for dots.
 */
export function JitteredLine<T>({
  data: inputDataPoints,
  dataKey,
  xDomain,
  jitterOffset = 0,
  color,
  strokeWidth = 2,
  opacity = 1,
  name,
  showDots = false,
  dotConfig,
  activeDotConfig,
  onPointClick,
}: JitteredLineProps<T>) {
  const { plotWidth, isValid } = useRechartScales();

  // Build line data with jitter applied when chart dimensions are available.
  // If chart dimensions aren't ready (isValid=false), render without jitter to avoid blank chart.
  const lineData = useMemo(() => {
    if (!inputDataPoints.length) return [];

    // Calculate jitter amount only when chart dimensions are valid and x-range is non-zero.
    // When xRange=0 (single data point), do not apply offset.
    let jitterAmount = 0;
    if (isValid && plotWidth > 0) {
      const [minTime, maxTime] = xDomain;
      const xRange = maxTime - minTime;
      if (xRange > 0) {
        const unitsPerPixel = xRange / plotWidth;
        jitterAmount = jitterOffset * unitsPerPixel;
      }
    }
    // Construct the jittered x values, preserving point id for click handlers.
    return inputDataPoints
      .map((point): JitteredLinePayloadData<T> | null => {
        const jitteredX = point.x + jitterAmount;
        if (isNaN(point.y) || isNaN(jitteredX)) return null;

        return {
          [dataKey]: jitteredX,
          y: point.y,
          userPayload: point.userPayload,
        } as JitteredLinePayloadData<T>;
      })
      .filter((p): p is JitteredLinePayloadData<T> => p !== null);
  }, [isValid, plotWidth, inputDataPoints, dataKey, xDomain, jitterOffset]);

  // Shared dot rendering logic. Returns null or a circle element.
  type DotProps = DotItemDotProps | ActiveDotProps;
  const renderDot = useCallback(
    (props: DotProps, config: DotConfig | undefined, defaults: { r: number; strokeWidth: number }) => {
      if (!showDots) return null;
      // Omit<> just to narrow it's any type to what we know it should be.
      const { cx, cy, payload } = props as Omit<DotProps, 'payload'> & { payload: JitteredLinePayloadData<T> };
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
          onClick={() => onPointClick?.(payload.userPayload)}
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
      legendType={name ? 'line' : 'none'}
      connectNulls={false}
    />
  );
}
