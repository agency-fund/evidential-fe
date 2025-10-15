'use client';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { computeAxisBounds, TimeSeriesDataPoint, ArmMetadata } from './forest-plot-utils';

interface ForestTimeseriesPlotProps {
  data: TimeSeriesDataPoint[];
  armMetadata: ArmMetadata[];
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

// Custom tooltip for the timeseries
interface CustomTimeseriesTooltipProps extends TooltipProps<ValueType, NameType> {
  armMetadata: ArmMetadata[];
}

function CustomTimeseriesTooltip({ active, payload, armMetadata }: CustomTimeseriesTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0]?.payload as TimeSeriesDataPoint | undefined;
  if (!dataPoint) return null;

  return (
    <Card size="1" variant="surface">
      <Flex direction="column" gap="2">
        <Text weight="bold" size="2">
          {dataPoint.date}
        </Text>
        {armMetadata.map((armInfo) => {
          const armData = dataPoint.armEffects.get(armInfo.id);
          if (!armData) return null;

          // Find the color from the payload if available
          const payloadEntry = payload.find((p) => p.name === armInfo.name);
          const color = payloadEntry?.color || 'var(--gray-12)';

          return (
            <Flex key={armInfo.id} direction="column" gap="1">
              <Text size="2" style={{ color }}>
                {armInfo.name || armInfo.id}
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
  const jitterSpacing = 6; // pixels between each arm's position
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
  // Dot appears when the line reaches its position (index / (totalPoints - 1))
  // For a single point, show immediately
  const dotThreshold = totalPoints > 1 ? index / (totalPoints - 1) : 0;
  const opacity = animationProgress >= dotThreshold ? 1 : 0;

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

  // Build path data - use useMemo since it's derived from props
  const pathData = useMemo(() => {
    if (!xAxisMap || !yAxisMap || !chartData.length || !armId) return '';

    const xAxis = Object.values(xAxisMap)[0];
    const yAxis = Object.values(yAxisMap)[0];
    if (!xAxis || !yAxis) return '';

    const { scale: xScale } = xAxis;
    const { scale: yScale } = yAxis;
    if (!xScale || !yScale) return '';

    const xOffset = calculateJitterOffset(armIndex, totalArms);

    // Build path from points with jitter applied
    const validPoints = chartData
      .map((dataPoint) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        const x = xScale(dataPoint.date) + xOffset;
        const y = yScale(armData.estimate);

        return { x, y };
      })
      .filter((p): p is { x: number; y: number } => p !== null);

    if (validPoints.length < 2) return '';

    return validPoints
      .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
      .join(' ');
  }, [xAxisMap, yAxisMap, chartData, armId, armIndex, totalArms]);

  // Measure path length for animation when path data changes
  useEffect(() => {
    if (!pathRef.current || !pathData) return;

    const timer = setTimeout(() => {
      if (pathRef.current) {
        const length = pathRef.current.getTotalLength();
        if (length > 0) {
          setPathLength(length);
        }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [pathData]);

  if (!pathData) return null;

  if (pathLength === 0) {
    // Render invisible path to measure it
    return <path ref={pathRef} d={pathData} stroke="none" fill="none" />;
  }

  // Calculate stroke-dashoffset based on animation progress
  // Start with full offset (hidden) and reduce to 0 (fully visible)
  const dashOffset = pathLength * (1 - animationProgress);

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
  strokeWidth?: number;
  capWidth?: number; // Width of the horizontal cap lines
  strokeLinecap?: 'round' | 'inherit' | 'butt' | 'square';
  opacity?: number;
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
  strokeWidth = 3,
  capWidth = 0,
  strokeLinecap = 'round',
  opacity = 0.5,
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

  // Calculate jitter offset for this arm to prevent overlapping CIs
  const xOffset = calculateJitterOffset(armIndex, totalArms);

  // Render confidence intervals for this arm at each data point
  return (
    <g>
      {chartData.map((dataPoint, pointIndex) => {
        const armData = dataPoint.armEffects.get(armId);
        if (!armData) return null;

        const x = xScale(dataPoint.date) + xOffset;
        const yLower = yScale(armData.lower);
        const yUpper = yScale(armData.upper);

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

export default function ForestTimeseriesPlot({
  data: chartData,
  armMetadata,
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
  }, [chartData]);

  // Early return if no data
  if (!chartData || chartData.length === 0) {
    return <Text>No timeseries data to display</Text>;
  }

  const yAxisValues: number[] = [];
  chartData.forEach((point) => point.armEffects.forEach((arm) => yAxisValues.push(arm.lower, arm.upper)));
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
          <Tooltip content={<CustomTimeseriesTooltip armMetadata={armMetadata} />} />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value, entry) => {
              // When dataKey is a function, use the entry name directly
              return entry.value || value;
            }}
          />

          {/* Render line and custom JitteredDots for each arm. Line is hidden since we'll use ArmJitteredLine instead. */}
          {armMetadata.map((armInfo, index) => {
            const color = getArmColor(index, armInfo.isBaseline);
            return (
              <Line
                key={`${armInfo.id}_effect`}
                dataKey={(point: TimeSeriesDataPoint) => point.armEffects.get(armInfo.id)?.estimate ?? null}
                name={armInfo.name || armInfo.id}
                stroke={color}
                strokeWidth={0} // 0 to avoid drawing this line between dots
                dot={(props: unknown) => {
                  const { key, ...restProps } = props as JitteredDotProps & { key?: string };
                  return (
                    <JitteredDot
                      key={key}
                      {...restProps}
                      fill={color}
                      armIndex={index}
                      totalArms={armMetadata.length}
                      animationProgress={easeOutCubic(animationProgress)}
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
                      totalArms={armMetadata.length}
                      animationProgress={easeOutCubic(animationProgress)}
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
          {armMetadata.map((armInfo, index) => {
            return (
              <Customized
                key={`line_${armInfo.id}`}
                component={
                  <ArmJitteredLine
                    chartData={chartData}
                    armId={armInfo.id}
                    color={getArmColor(index, armInfo.isBaseline)}
                    armIndex={index}
                    totalArms={armMetadata.length}
                    animationProgress={easeOutCubic(animationProgress)}
                  />
                }
              />
            );
          })}

          {/* Render confidence intervals for each arm */}
          {armMetadata.map((armInfo, index) => {
            return (
              <Customized
                key={`ci_${armInfo.id}`}
                component={
                  <ArmConfidenceInterval
                    chartData={chartData}
                    armId={armInfo.id}
                    color={getArmColor(index, armInfo.isBaseline)}
                    armIndex={index}
                    totalArms={armMetadata.length}
                    animationProgress={easeOutCubic(animationProgress)}
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
