'use client';
import { useState, useEffect } from 'react';
import { Box, Callout, Card, Flex, Text } from '@radix-ui/themes';
import {
  CartesianGrid,
  Legend,
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
  getColorWithSignificance,
  Significance,
  getArmColor,
  getArmColorEnumForText,
} from './forest-plot-utils';
import { JitteredLine, JitteredLineInputData, JitteredLinePayloadData } from './jittered-line';
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

  // The payload we're expecting comes from JitteredLine, which uses the JitteredLinePayloadData
  // interface.  We use its `userPayload` (the original TimeSeriesDataPoint) to render the tooltip.
  const jitteredLinePayload = payload[0]?.payload as JitteredLinePayloadData<TimeSeriesDataPoint> | undefined;
  const tsDataPoint = jitteredLinePayload?.userPayload as TimeSeriesDataPoint | undefined;
  if (!tsDataPoint) return null;

  return (
    <Card size="1" variant="surface">
      <Flex direction="column" gap="2">
        <Text weight="bold" size="2">
          {tsDataPoint.date}
        </Text>
        {armMetadata.map((armInfo, index) => {
          const armData = tsDataPoint.armEffects.get(armInfo.id);
          if (!armData) return null;

          const textColorEnum = getArmColorEnumForText(index, armInfo.isBaseline);
          const isSelected = selectedArmId === armInfo.id;

          return (
            <Flex key={armInfo.id} direction="column" gap="1">
              <Flex direction="row" gap="1" align="center">
                <Text size={isSelected ? '4' : '2'} weight="bold" color={textColorEnum}>
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
  // useEffect to avoid state update during render phase.
  useEffect(() => {
    if (!selectedArmId && armMetadata.length > 0) {
      const baselineArm = armMetadata.find((arm) => arm.isBaseline);
      setSelectedArmId(baselineArm?.id ?? armMetadata[0]?.id ?? null);
    }
  }, [selectedArmId, armMetadata]);

  const selectedArmName = armMetadata.find((arm) => arm.id === selectedArmId)?.name || null;

  // Updates the plot and tooltip, and notifies parent of what snapshot was clicked.
  const handlePointClick = (armId: string, snapshotKey: string) => {
    setSelectedArmId(armId);
    onPointClick?.(snapshotKey);
  };

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
  // Pre-calculate each arm's timeseries points for JitteredLine.
  const armPointsMap = new Map<string, JitteredLineInputData<TimeSeriesDataPoint>[]>();
  armMetadata.forEach((arm) => {
    const points: JitteredLineInputData<TimeSeriesDataPoint>[] = [];
    chartData.forEach((d) => {
      const armData = d.armEffects.get(arm.id);
      if (armData) {
        points.push({ x: d.dateTimestampMs, y: armData.absMean, userPayload: d });
      }
    });
    armPointsMap.set(arm.id, points);
  });

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
  // Normally the x-axis domain spans the set of date ticks, but in the edge case of a single data
  // point, we artificially expand the domain so that we can accommodate jittered arm data points.
  const domainXAxis: [number, number] =
    allDateTicks.length > 1
      ? [allDateTicks[0], allDateTicks[allDateTicks.length - 1]]
      : [allDateTicks[0] - minWidth / 2, allDateTicks[0] + minWidth / 2];

  return (
    <Box height={`${height}px`} overflowY="clip" overflowX="auto">
      <ResponsiveContainer height="100%" minWidth={`${minWidth}px`}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateTimestampMs"
            type="number"
            domain={domainXAxis}
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
              paddingBottom: '20px',
            }}
            formatter={(value) => {
              // value is the name passed to the line, i.e. the arm id
              const index = armMetadata.findIndex((arm) => arm.id === value);
              const arm = armMetadata[index];
              const textColorEnum = getArmColorEnumForText(index, arm.isBaseline);
              const selected = arm.name === selectedArmName;
              return (
                <Text size="3" weight={selected ? 'bold' : 'regular'} color={textColorEnum} key={arm.id}>
                  {arm.name}
                </Text>
              );
            }}
            onClick={(data) => {
              setSelectedArmId(data.value ?? null);
            }}
          />

          {/* Render jittered line segments with dots for each arm */}
          {armMetadata.map((armInfo, index) => {
            const selected = selectedArmId === armInfo.id;
            // Always emphasize dots (use true for isSelected in getArmColor)
            const baseDotColor = getArmColor(index, armInfo.isBaseline, true);
            const fillDotColor = getColorWithSignificance(baseDotColor, Significance.No, selected);
            return (
              <JitteredLine
                key={`line_${armInfo.id}`}
                data={armPointsMap.get(armInfo.id) || []}
                dataKey="dateTimestampMs"
                xDomain={domainXAxis}
                jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                color={getArmColor(index, armInfo.isBaseline, selected)}
                name={armInfo.id}
                showDots
                dotConfig={{ fill: fillDotColor, stroke: baseDotColor }}
                activeDotConfig={{ fill: fillDotColor, stroke: baseDotColor }}
                onPointClick={(tsDataPoint) => handlePointClick(armInfo.id, tsDataPoint.key)}
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
                baseColor={getArmColor(index, armInfo.isBaseline, selected)}
                jitterOffset={calculateJitterOffset(index, armMetadata.length)}
                onClick={(tsDataPoint) => handlePointClick(armInfo.id, tsDataPoint.key)}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
