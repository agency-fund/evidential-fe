'use client';
import { useState } from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
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
  ARM_COLORS,
  INACTIVE_ARM_COLORS,
  CONTROL_COLOR,
  INACTIVE_CONTROL_COLOR,
  getColorWithSignificance,
} from './forest-plot-utils';
import { JitteredDot, JitteredDotProps } from './jittered-dot';
import { JitteredLine } from './jittered-line';
import { ConfidenceInterval } from './confidence-interval';
import { formatDateUtcYYYYMMDD } from '@/services/date-utils';

interface ForestTimeseriesPlotProps {
  data: TimeSeriesDataPoint[];
  armMetadata: ArmMetadata[];
  minDate: Date;
  maxDate: Date;
}

// Get color for an arm based on its index, baseline status, and selection state
const getArmColor = (armIndex: number, isBaseline: boolean | undefined, isSelected: boolean): string => {
  if (isBaseline === undefined || isBaseline) {
    return isSelected ? CONTROL_COLOR : INACTIVE_CONTROL_COLOR;
  }

  const colorIndex = (armIndex - 1) % ARM_COLORS.length;
  return isSelected ? ARM_COLORS[colorIndex] : INACTIVE_ARM_COLORS[colorIndex];
};

// Custom tooltip for the timeseries
interface CustomTimeseriesTooltipProps extends TooltipProps<ValueType, NameType> {
  armMetadata: ArmMetadata[];
  selectedArmId: string | null;
}

function CustomTimeseriesTooltip({ active, payload, armMetadata, selectedArmId }: CustomTimeseriesTooltipProps) {
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
          const color = payloadEntry?.color || CONTROL_COLOR;

          const isSelected = selectedArmId === armInfo.id;

          return (
            <Flex key={armInfo.id} direction="column" gap="1">
              <Flex direction="row" gap="1" align="center">
                <Text size={isSelected ? '4' : '2'} weight="bold" style={{ color }}>
                  {armInfo.name || armInfo.id}:
                </Text>
                <Text size="2"> {armData.absEstimate.toFixed(2)}</Text>
              </Flex>
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
  minDate,
  maxDate,
}: ForestTimeseriesPlotProps) {
  // Default selected arm to the baseline
  const baselineArm = armMetadata.find((arm) => arm.isBaseline);
  const [selectedArmId, setSelectedArmId] = useState<string | null>(baselineArm?.id || armMetadata[0]?.id || null);

  // Early return if no data
  if (!chartData || chartData.length === 0) {
    return <Text>No timeseries data to display</Text>;
  }

  const yAxisValues: number[] = [];
  chartData.forEach((point) => point.armEffects.forEach((arm) => yAxisValues.push(arm.lower, arm.upper)));
  const [minY, maxY] = computeAxisBounds(yAxisValues);

  // Generate all date ticks between minDate and maxDate for x-axis
  const allDateTicks: number[] = [];
  const currentDate = new Date(minDate);
  currentDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date(maxDate);
  endDate.setUTCHours(0, 0, 0, 0);
  while (currentDate <= endDate) {
    allDateTicks.push(currentDate.getTime());
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  const commonAxisStyle = {
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
  };

  // Grow the plot height to accommodate the tooltip
  const height = Math.max(400, armMetadata.length * 60);
  const minWidth = allDateTicks.length * armMetadata.length * 8;
  return (
    <Box height={`${height}px`} overflowY="clip" overflowX="auto">
      <ResponsiveContainer height="100%" minWidth={`${minWidth}px`}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateTimestampMs"
            type="number"
            domain={[allDateTicks[0], allDateTicks[allDateTicks.length - 1]]}
            ticks={allDateTicks}
            style={commonAxisStyle}
            padding={{ left: 12, right: 0 }}
            interval="preserveStartEnd"
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return formatDateUtcYYYYMMDD(date);
            }}
          />
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
          <Tooltip content={<CustomTimeseriesTooltip armMetadata={armMetadata} selectedArmId={selectedArmId} />} />
          <Legend
            wrapperStyle={{
              position: 'fixed', // 1. Break it out of the chart's flow
              left: '50%', // 2. Position it relative to the viewport
              transform: 'translateX(-50%)', // 3. Center it based on its own width
              zIndex: 1000, // 4. Ensure it's above other page content
              cursor: 'pointer',
            }}
            formatter={(value, entry) => {
              // When dataKey is a function, use the entry name directly
              return entry.value || value;
            }}
            onClick={(data) => {
              const clickedArm = armMetadata.find((arm) => arm.name === data.value);
              if (clickedArm) setSelectedArmId(clickedArm.id);
            }}
          />

          {/* Render jittered line segments for each arm. Separate loop to keep as direct children of the LineChart. */}
          {armMetadata.map((armInfo, index) => {
            return (
              <Customized
                key={`line_${armInfo.id}`}
                component={
                  <JitteredLine
                    chartData={chartData}
                    armId={armInfo.id}
                    color={getArmColor(index, armInfo.isBaseline, selectedArmId === armInfo.id)}
                    jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                  />
                }
              />
            );
          })}

          {/* Render confidence intervals for each arm */}
          {armMetadata.map((armInfo, index) => {
            const selected = selectedArmId === armInfo.id;
            return (
              <Customized
                key={`ci_${armInfo.id}`}
                component={
                  <ConfidenceInterval
                    chartData={chartData}
                    armId={armInfo.id}
                    selected={selected}
                    baseColor={getArmColor(index, armInfo.isBaseline, selected)}
                    jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                  />
                }
              />
            );
          })}

          {/* Place JitteredDots on top for each arm. Hide line with width=0 since we use ArmJitteredLine. */}
          {armMetadata.map((armInfo, index) => {
            const selected = selectedArmId === armInfo.id;
            // Always emphasize points and the legend
            const baseDotColor = getArmColor(index, armInfo.isBaseline, true);
            return (
              <Line
                key={`${armInfo.id}_effect`}
                dataKey={(point: TimeSeriesDataPoint) => point.armEffects.get(armInfo.id)?.absEstimate ?? null}
                name={armInfo.name || armInfo.id}
                stroke={baseDotColor} // color is still needed since it is used by the legend and tooltip
                strokeWidth={0} // 0 to avoid drawing this line between dots
                dot={(props: unknown) => {
                  const { key, ...restProps } = props as JitteredDotProps & { key?: string };
                  const dataPoint = restProps.payload as TimeSeriesDataPoint;
                  const armData = dataPoint.armEffects.get(armInfo.id);
                  const dotColor = armData
                    ? getColorWithSignificance(baseDotColor, armData.significant, armData.estimate > 0, selected)
                    : baseDotColor;

                  return (
                    <JitteredDot
                      key={key}
                      {...restProps}
                      fill={baseDotColor}
                      stroke={dotColor}
                      r={3}
                      strokeWidth={1}
                      jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                    />
                  );
                }}
                activeDot={(props: unknown) => {
                  const { key, ...restProps } = props as JitteredDotProps & { key?: string };
                  const dataPoint = restProps.payload as TimeSeriesDataPoint;
                  const armData = dataPoint.armEffects.get(armInfo.id);
                  const dotColor = armData
                    ? getColorWithSignificance(baseDotColor, armData.significant, armData.estimate > 0, selected)
                    : baseDotColor;

                  return (
                    <JitteredDot
                      key={key}
                      {...restProps}
                      fill={baseDotColor}
                      stroke={dotColor}
                      r={4}
                      strokeWidth={2}
                      jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                      onClick={() => setSelectedArmId(armInfo.id)}
                    />
                  );
                }}
                connectNulls={false}
                isAnimationActive={false} // disable recharts' default animation to use our own with dots.
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
