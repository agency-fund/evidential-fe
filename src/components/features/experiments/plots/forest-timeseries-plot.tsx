'use client';
import { useState } from 'react';
import { Box, Callout, Card, Flex, Text } from '@radix-ui/themes';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  computeAxisBounds,
  TimeSeriesDataPoint,
  ArmMetadata,
  calculateJitterOffset,
  CONTROL_COLOR,
  getColorWithSignificance,
  Significance,
  getArmColor,
} from './forest-plot-utils';
import { JitteredDot, JitteredDotProps } from './jittered-dot';
import { JitteredLine } from './jittered-line';
import { ConfidenceInterval } from './confidence-interval';
import { formatDateUtcYYYYMMDD } from '@/services/date-utils';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface ForestTimeseriesPlotProps {
  data: TimeSeriesDataPoint[];
  armMetadata: ArmMetadata[];
  minDate: Date;
  maxDate: Date;
  // Can notify parent of what snapshot key was used for the data point that was clicked.
  onPointClick?: (key: string) => void;
}

// Custom tooltip for the timeseries
interface CustomTimeseriesTooltipProps extends TooltipContentProps<ValueType, NameType> {
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
                <Text size="2"> {armData.absMean.toFixed(2)}</Text>
              </Flex>
              <Text size="1">
                95% CI: [{armData.lowerCI.toFixed(2)}, {armData.upperCI.toFixed(2)}]
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
  onPointClick,
}: ForestTimeseriesPlotProps) {
  const [selectedArmId, setSelectedArmId] = useState<string | null>(null);

  // Default selected arm to the baseline if there is one, else fallback to the first arm.
  if (!selectedArmId && armMetadata.length > 0) {
    const baselineArm = armMetadata.find((arm) => arm.isBaseline);
    setSelectedArmId(baselineArm?.id || armMetadata[0]?.id || null);
  }

  const selectedArmName = armMetadata.find((arm) => arm.id === selectedArmId)?.name || null;

  // Early return if no data
  if (!chartData || chartData.length === 0) {
    return (
      <Callout.Root color={'orange'}>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>No timeseries data to display yet.</Callout.Text>
      </Callout.Root>
    );
  }

  const yAxisValues: number[] = [];
  chartData.forEach((point) => point.armEffects.forEach((arm) => yAxisValues.push(arm.lowerCI, arm.upperCI)));
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
            // WARNING: If we offset the axis with padding, we need to also factor in the reduced
            // plot width in the lines and CIs! Arguably a bug in recharts' useOffset hook?
            padding={{ left: 0, right: 0 }}
            interval="preserveStartEnd"
            angle={-30}
            textAnchor="end"
            height={40}
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
          <Tooltip
            content={(props) => (
              <CustomTimeseriesTooltip {...props} armMetadata={armMetadata} selectedArmId={selectedArmId} />
            )}
          />
          <Legend
            wrapperStyle={{
              position: 'fixed', // 1. Break it out of the chart's flow
              left: '50%', // 2. Position it relative to the viewport
              transform: 'translateX(-50%)', // 3. Center it based on its own width
              zIndex: 1000, // 4. Ensure it's above other page content
              cursor: 'pointer',
              // Allow the legend to wrap to multiple lines if the text is too long:
              whiteSpace: 'normal',
              width: '100%',
            }}
            formatter={(value, entry) => {
              // When dataKey is a function, use the entry name directly
              const armName = entry.value || value;
              const selected = armName === selectedArmName;
              return (
                <Text size="3" weight={selected ? 'bold' : 'regular'}>
                  {armName}
                </Text>
              );
            }}
            onClick={(data) => {
              const clickedArm = armMetadata.find((arm) => arm.name === data.value);
              if (clickedArm) setSelectedArmId(clickedArm.id);
            }}
          />

          {/* Render jittered line segments for each arm. Separate loop to keep as direct children of the LineChart. */}
          {armMetadata.map((armInfo, index) => {
            return (
              <JitteredLine
                key={`line_${armInfo.id}`}
                chartData={chartData}
                armId={armInfo.id}
                color={getArmColor(index, armInfo.isBaseline, selectedArmId === armInfo.id)}
                xDomain={[allDateTicks[0], allDateTicks[allDateTicks.length - 1]]}
                yDomain={[minY, maxY]}
                jitterOffset={calculateJitterOffset(index, armMetadata.length)}
              />
            );
          })}

          {/* Render confidence intervals for each arm */}
          {armMetadata.map((armInfo, index) => {
            const selected = selectedArmId === armInfo.id;
            return (
              <ConfidenceInterval
                key={`ci_${armInfo.id}`}
                chartData={chartData}
                armId={armInfo.id}
                selected={selected}
                baseColor={getArmColor(index, armInfo.isBaseline, selected)}
                jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                onClick={(dataPoint) => {
                  setSelectedArmId(armInfo.id);
                  onPointClick?.(dataPoint.key);
                }}
              />
            );
          })}

          {/* Place JitteredDots on top for each arm. Hide line with width=0 since we use JitteredLine. */}
          {armMetadata.map((armInfo, index) => {
            const selected = selectedArmId === armInfo.id;
            // Always emphasize points and the legend
            const baseDotColor = getArmColor(index, armInfo.isBaseline, true);
            return (
              <Line
                key={`${armInfo.id}_effect`}
                dataKey={(point: TimeSeriesDataPoint) => {
                  const armPoint = point.armEffects.get(armInfo.id);
                  if (!armPoint) return null;
                  return armPoint.absMean;
                }}
                name={armInfo.name || armInfo.id}
                stroke={baseDotColor} // color is still needed since it is used by the legend and tooltip
                strokeWidth={0} // 0 to avoid drawing this line between dots
                dot={(props: unknown) => {
                  const { key, ...restProps } = props as JitteredDotProps & { key?: string };
                  const fillDotColor = getColorWithSignificance(baseDotColor, Significance.No, selected);
                  return (
                    <JitteredDot
                      key={key}
                      {...restProps}
                      fill={fillDotColor}
                      stroke={baseDotColor}
                      r={3}
                      strokeWidth={1}
                      jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                    />
                  );
                }}
                activeDot={(props: unknown) => {
                  const { key, ...restProps } = props as JitteredDotProps & { key?: string };
                  const dataPoint = restProps.payload as TimeSeriesDataPoint;
                  const fillDotColor = getColorWithSignificance(baseDotColor, Significance.No, selected);

                  return (
                    <JitteredDot
                      key={key}
                      {...restProps}
                      fill={fillDotColor}
                      stroke={baseDotColor}
                      r={5}
                      strokeWidth={2}
                      jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                      onClick={() => {
                        // Updates the plot and tooltip, and notifies parent of what snapshot was clicked.
                        setSelectedArmId(armInfo.id);
                        onPointClick?.(dataPoint.key);
                      }}
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
