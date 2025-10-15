'use client';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  Customized,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { EffectSizeData, computeAxisBounds } from './forest-plot-utils';
import { formatIsoDateYYYYMMDD } from '@/services/date-utils';

export type EffectSizeDataOnDate = {
  key: string;
  date: Date;
  effectSizes: EffectSizeData[];
};

interface ForestTimeseriesPlotProps {
  effectSizesOverTime?: EffectSizeDataOnDate[];
  // If provided, use these values as hints for the y-axis domain.
  // May still be adjusted to accommodate the displayed effect sizes.
  minY?: number;
  maxY?: number;
}

// Radix level 12 colors for different arms (high contrast, suitable for text/icons)
const ARM_COLORS = ['#5746af', '#3e63dd', '#3e5ba9', '#0090ff'] as const; // violet-12, iris-12, indigo-12, blue-12
const CONTROL_COLOR = '#bbbbbb'; // Gray for control/baseline arm

// Get color for an arm based on its index and baseline status
const getArmColor = (armIndex: number, isBaseline: boolean | undefined): string => {
  if (isBaseline === undefined || isBaseline) return CONTROL_COLOR;
  return ARM_COLORS[armIndex % ARM_COLORS.length];
};

// Transform data for recharts LineChart
interface ArmDataPoint {
  estimate: number;
  upper: number;
  lower: number;
}

interface TimeSeriesDataPoint {
  date: string; // YYYY-MM-DD format
  dateObj: Date; // For sorting/reference
  armData: Map<string, ArmDataPoint>; // armId => ArmDataPoint
}

function transformDataForChart(effectSizesOverTime: EffectSizeDataOnDate[]): {
  chartData: TimeSeriesDataPoint[];
  armIds: string[];
  armNames: Map<string, string>;
  armIsBaseline: Map<string, boolean>;
} {
  const chartData: TimeSeriesDataPoint[] = [];
  const armIds = new Set<string>();
  const armNames = new Map<string, string>();
  const armIsBaseline = new Map<string, boolean>();

  // Sort by date ascending (oldest to newest)
  const sortedData = [...effectSizesOverTime].sort((a, b) => a.date.getTime() - b.date.getTime());

  for (const dataPoint of sortedData) {
    const dateStr = formatIsoDateYYYYMMDD(dataPoint.date.toISOString());
    const armData = new Map<string, ArmDataPoint>();

    for (const effectSize of dataPoint.effectSizes) {
      armIds.add(effectSize.armId);
      armNames.set(effectSize.armId, effectSize.armName);
      armIsBaseline.set(effectSize.armId, effectSize.isBaseline);

      // Store arm data in the map
      armData.set(effectSize.armId, {
        estimate: effectSize.absEffect,
        upper: effectSize.absCI95Upper,
        lower: effectSize.absCI95Lower,
      });
    }

    chartData.push({
      date: dateStr,
      dateObj: dataPoint.date,
      armData,
    });
  }

  return {
    chartData,
    armIds: Array.from(armIds),
    armNames,
    armIsBaseline,
  };
}

// Custom tooltip for the timeseries
interface CustomTimeseriesTooltipProps extends TooltipProps<ValueType, NameType> {
  armIds?: string[];
  armNames?: Map<string, string>;
}

function CustomTimeseriesTooltip({ active, payload, armIds = [], armNames = new Map() }: CustomTimeseriesTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0]?.payload as TimeSeriesDataPoint | undefined;
  if (!dataPoint) return null;

  return (
    <Card size="1" variant="surface">
      <Flex direction="column" gap="2">
        <Text weight="bold" size="2">
          {dataPoint.date}
        </Text>
        {armIds.map((armId, idx) => {
          const armData = dataPoint.armData.get(armId);
          if (!armData) return null;

          // Find the color from the payload if available
          const payloadEntry = payload.find((p) => p.name === armNames.get(armId));
          const color = payloadEntry?.color || 'var(--gray-12)';

          return (
            <Flex key={idx} direction="column" gap="1">
              <Text size="2" style={{ color }}>
                {armNames.get(armId) || armId}
              </Text>
              <Text size="1">Effect: {armData.estimate.toFixed(2)}</Text>
              <Text size="1">
                95% CI: [{armData.lower.toFixed(2)}, {armData.upper.toFixed(2)}]
              </Text>
            </Flex>
          );
        })}
      </Flex>
    </Card>
  );
}

// Helper function to calculate x-axis jitter offset
function calculateJitterOffset(armIndex: number, totalArms: number): number {
  const jitterSpacing = 8; // pixels between each arm's position
  const totalWidth = (totalArms - 1) * jitterSpacing;
  return armIndex * jitterSpacing - totalWidth / 2;
}

// Ease-out cubic function for smooth animation
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// Custom dot component for Line that applies jitter
interface JitteredDotProps {
  cx?: number;
  cy?: number;
  r?: number;
  fill?: string;
  stroke?: string;
  armIndex: number;
  totalArms: number;
  index?: number;
  animationProgress?: number;
  totalPoints?: number;
}

function JitteredDot({
  cx,
  cy,
  r = 4,
  fill,
  stroke,
  armIndex,
  totalArms,
  index = 0,
  animationProgress = 1,
  totalPoints = 1,
}: JitteredDotProps) {
  if (cx === undefined || cy === undefined) return null;

  const xOffset = calculateJitterOffset(armIndex, totalArms);

  // Calculate if this dot should be visible based on animation progress
  // Apply ease-out to the progress
  const easedProgress = easeOutCubic(animationProgress);
  // Dot appears when the line reaches its position (index / (totalPoints - 1))
  // For a single point, show immediately
  const dotThreshold = totalPoints > 1 ? index / (totalPoints - 1) : 0;
  const opacity = easedProgress >= dotThreshold ? 1 : 0;

  return (
    <circle
      cx={cx + xOffset}
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

// Custom component to render a jittered line for a single arm
interface ArmJitteredLineProps {
  xAxisMap?: Record<string, { scale: (value: string) => number }>;
  yAxisMap?: Record<string, { scale: (value: number) => number }>;
  chartData: TimeSeriesDataPoint[];
  armId: string;
  color: string;
  armIndex: number;
  totalArms: number;
  strokeWidth?: number;
  animationProgress?: number;
}

function ArmJitteredLine({
  xAxisMap,
  yAxisMap,
  chartData,
  armId,
  color,
  armIndex,
  totalArms,
  strokeWidth = 2,
  animationProgress = 1,
}: ArmJitteredLineProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [pathData, setPathData] = useState('');

  // Build path data - must be before early returns to avoid hook issues
  useEffect(() => {
    if (!xAxisMap || !yAxisMap || !chartData.length || !armId || !color) {
      setPathData('');
      return;
    }

    const xAxis = Object.values(xAxisMap)[0];
    const yAxis = Object.values(yAxisMap)[0];

    if (!xAxis || !yAxis) {
      setPathData('');
      return;
    }

    const { scale: xScale } = xAxis;
    const { scale: yScale } = yAxis;

    if (!xScale || !yScale) {
      setPathData('');
      return;
    }

    const xOffset = calculateJitterOffset(armIndex, totalArms);

    // Build path from points with jitter applied
    const validPoints = chartData
      .map((dataPoint) => {
        const armData = dataPoint.armData.get(armId);
        if (!armData) return null;

        const x = xScale(dataPoint.date) + xOffset;
        const y = yScale(armData.estimate);

        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (validPoints.length < 2) {
      setPathData('');
      return;
    }

    const newPathData = validPoints
      .map((point, index) => {
        return index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`;
      })
      .join(' ');

    setPathData(newPathData);
  }, [xAxisMap, yAxisMap, chartData, armId, color, armIndex, totalArms]);

  // Get path length for animation - need to update when ref is set
  useEffect(() => {
    if (pathRef.current && pathData && pathLength === 0) {
      // Use setTimeout to ensure path is fully rendered before measuring
      const timer = setTimeout(() => {
        if (pathRef.current) {
          const length = pathRef.current.getTotalLength();
          if (length > 0) {
            setPathLength(length);
          }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [pathData, pathLength]);

  if (!pathData) return null;

  if (pathLength === 0) {
    // Render invisible path to measure it
    return <path ref={pathRef} d={pathData} stroke="none" fill="none" />;
  }

  // Calculate stroke-dashoffset based on animation progress with ease-out
  const easedProgress = easeOutCubic(animationProgress);
  // Start with full offset (hidden) and reduce to 0 (fully visible)
  const dashOffset = pathLength * (1 - easedProgress);

  return (
    <path
      ref={pathRef}
      d={pathData}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={pathLength}
      strokeDashoffset={dashOffset}
    />
  );
}

// Custom component to render confidence intervals for a single arm
interface ArmConfidenceIntervalProps {
  xAxisMap?: Record<string, { scale: (value: string) => number }>;
  yAxisMap?: Record<string, { scale: (value: number) => number }>;
  chartData: TimeSeriesDataPoint[];
  armId: string;
  color: string;
  armIndex: number;
  totalArms: number;
  animationProgress?: number;
}

function ArmConfidenceInterval({
  xAxisMap,
  yAxisMap,
  chartData,
  armId,
  color,
  armIndex,
  totalArms,
  animationProgress = 1,
}: ArmConfidenceIntervalProps) {
  if (!xAxisMap || !yAxisMap || !chartData.length || !armId || !color) return null;
  // These params are special internal params for recharts.
  // TODO: update to recharts 3+ API to replace magic with hooks.
  const xAxis = Object.values(xAxisMap)[0];
  const yAxis = Object.values(yAxisMap)[0];

  if (!xAxis || !yAxis) return null;

  // Get the x and y scales from the chart
  const { scale: xScale } = xAxis;
  const { scale: yScale } = yAxis;

  if (!xScale || !yScale) return null;

  // Width of the horizontal caps
  const capWidth = 6;

  // Calculate jitter offset for this arm to prevent overlapping CIs
  const xOffset = calculateJitterOffset(armIndex, totalArms);

  // Apply ease-out to the progress
  const easedProgress = easeOutCubic(animationProgress);

  // Render confidence intervals for this arm at each data point
  return (
    <g>
      {chartData.map((dataPoint, pointIndex) => {
        const armData = dataPoint.armData.get(armId);
        if (!armData) return null;

        const x = xScale(dataPoint.date) + xOffset;
        const yLower = yScale(armData.lower);
        const yUpper = yScale(armData.upper);

        // Each CI appears when the line reaches its position
        const totalPoints = chartData.length;
        const ciThreshold = totalPoints > 1 ? pointIndex / (totalPoints - 1) : 0;
        const opacity = easedProgress >= ciThreshold ? 0.6 : 0;

        return (
          <g key={`ci-${armId}-${pointIndex}`} style={{ transition: 'opacity 0.15s ease-out' }}>
            {/* Vertical line from lower to upper CI */}
            <line x1={x} y1={yLower} x2={x} y2={yUpper} stroke={color} strokeWidth={1.5} opacity={opacity} />
            {/* Lower cap */}
            <line
              x1={x - capWidth / 2}
              y1={yLower}
              x2={x + capWidth / 2}
              y2={yLower}
              stroke={color}
              strokeWidth={1.5}
              opacity={opacity}
            />
            {/* Upper cap */}
            <line
              x1={x - capWidth / 2}
              y1={yUpper}
              x2={x + capWidth / 2}
              y2={yUpper}
              stroke={color}
              strokeWidth={1.5}
              opacity={opacity}
            />
          </g>
        );
      })}
    </g>
  );
}

export default function ForestTimeseriesPlot({
  effectSizesOverTime,
  minY: minYProp,
  maxY: maxYProp,
}: ForestTimeseriesPlotProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

  // Animation: 0 to 1 over 1.5 seconds
  useEffect(() => {
    const durationMs = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / durationMs, 1);
      setAnimationProgress(rawProgress);

      if (rawProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [effectSizesOverTime]);

  // Early return if no data
  if (!effectSizesOverTime || effectSizesOverTime.length === 0) {
    return <Text>No timeseries data to display</Text>;
  }

  const { chartData, armIds, armNames, armIsBaseline } = transformDataForChart(effectSizesOverTime);

  if (chartData.length === 0 || armIds.length === 0) {
    return <Text>No valid data points to display</Text>;
  }

  const yAxisValues: number[] = [];
  chartData.forEach((point) => point.armData.forEach((arm) => yAxisValues.push(arm.lower, arm.upper)));
  const [minY, maxY] = computeAxisBounds(yAxisValues, minYProp, maxYProp);

  const commonAxisStyle = {
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
  };

  return (
    // TODO? should we make height dynamic somehow?
    <Box height="400px">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" style={commonAxisStyle} padding={{ left: 30, right: 30 }} />
          <YAxis
            domain={[minY, maxY]}
            style={commonAxisStyle}
            tickFormatter={(value) =>
              // Show <= 2 decimal places only for values < 10
              Math.abs(value) >= 10 || value === 0
                ? value.toFixed()
                : Math.abs(value) >= 1
                  ? value.toFixed(1)
                  : value.toFixed(2)
            }
          />
          <Tooltip content={<CustomTimeseriesTooltip armIds={armIds} armNames={armNames} />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value, entry) => {
              // When dataKey is a function, use the entry name directly
              return entry.value || value;
            }}
          />

          {/* Render jittered lines and dots for each arm */}
          {armIds.map((armId, index) => {
            const color = getArmColor(index, armIsBaseline.get(armId));
            return (
              <Line
                key={`${armId}_effect`}
                dataKey={(point: TimeSeriesDataPoint) => point.armData.get(armId)?.estimate ?? null}
                name={armNames.get(armId) || armId}
                stroke="none"
                dot={(props: unknown) => {
                  const { key, ...restProps } = props as JitteredDotProps & { key?: string };
                  return (
                    <JitteredDot
                      key={key}
                      {...restProps}
                      fill={color}
                      armIndex={index}
                      totalArms={armIds.length}
                      animationProgress={animationProgress}
                      totalPoints={chartData.length}
                    />
                  );
                }}
                activeDot={(props: unknown) => {
                  const { key, ...restProps } = props as JitteredDotProps & { key?: string };
                  return (
                    <JitteredDot
                      key={key}
                      {...restProps}
                      r={6}
                      fill={color}
                      armIndex={index}
                      totalArms={armIds.length}
                      animationProgress={animationProgress}
                      totalPoints={chartData.length}
                    />
                  );
                }}
                connectNulls={false}
                isAnimationActive={true}
              />
            );
          })}

          {/* Render jittered line segments for each arm. Separate loop to keep as direct children of the LineChart. */}
          {armIds.map((armId, index) => {
            return (
              <Customized
                key={`line_${armId}`}
                component={
                  <ArmJitteredLine
                    chartData={chartData}
                    armId={armId}
                    color={getArmColor(index, armIsBaseline.get(armId))}
                    armIndex={index}
                    totalArms={armIds.length}
                    animationProgress={animationProgress}
                  />
                }
              />
            );
          })}

          {/* Render confidence intervals for each arm */}
          {armIds.map((armId, index) => {
            return (
              <Customized
                key={`ci_${armId}`}
                component={
                  <ArmConfidenceInterval
                    chartData={chartData}
                    armId={armId}
                    color={getArmColor(index, armIsBaseline.get(armId))}
                    armIndex={index}
                    totalArms={armIds.length}
                    animationProgress={animationProgress}
                  />
                }
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
