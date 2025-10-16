'use client';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
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
import {
  computeAxisBounds,
  TimeSeriesDataPoint,
  ArmMetadata,
  calculateJitterOffset,
  easeOutCubic,
} from '../forest-plot-utils';
import { JitteredDot, JitteredDotProps } from './jittered-dot';
import { JitteredLine } from './jittered-line';
import { ConfidenceInterval } from './confidence-interval';

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
      setAnimationProgress(easeOutCubic(rawProgress));

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
          <XAxis dataKey="date" style={commonAxisStyle} padding={{ left: 12, right: 0 }} />
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
                      jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                      totalPoints={chartData.length}
                      animationProgress={animationProgress}
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
                      jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                      totalPoints={chartData.length}
                      animationProgress={animationProgress}
                    />
                  );
                }}
                connectNulls={false}
                isAnimationActive={false} // disable recharts' default animation to use our own with dots.
              />
            );
          })}

          {/* Render jittered line segments for each arm. Separate loop to keep as direct children of the LineChart. */}
          {armMetadata.map((armInfo, index) => {
            return (
              <Customized
                key={`line_${armInfo.id}`}
                component={
                  <JitteredLine
                    chartData={chartData}
                    armId={armInfo.id}
                    color={getArmColor(index, armInfo.isBaseline)}
                    jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                    animationProgress={animationProgress}
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
                  <ConfidenceInterval
                    chartData={chartData}
                    armId={armInfo.id}
                    color={getArmColor(index, armInfo.isBaseline)}
                    jitterOffset={calculateJitterOffset(index, armMetadata.length)}
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
