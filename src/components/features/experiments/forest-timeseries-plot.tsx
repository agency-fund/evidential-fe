'use client';
import { Box, Flex, Text } from '@radix-ui/themes';
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
import { EffectSizeData } from './forest-plot-utils';
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
const getArmColor = (armIndex: number, isBaseline: boolean): string => {
  if (isBaseline) return CONTROL_COLOR;
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
    <Box style={{ background: 'white', padding: '12px', border: '1px solid var(--gray-6)', borderRadius: '8px' }}>
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
    </Box>
  );
}

// Helper function to calculate x-axis jitter offset
function calculateJitterOffset(armIndex: number, totalArms: number): number {
  const jitterSpacing = 8; // pixels between each arm's position
  const totalWidth = (totalArms - 1) * jitterSpacing;
  return armIndex * jitterSpacing - totalWidth / 2;
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
}

function JitteredDot({ cx, cy, r = 4, fill, stroke, armIndex, totalArms }: JitteredDotProps) {
  if (cx === undefined || cy === undefined) return null;

  const xOffset = calculateJitterOffset(armIndex, totalArms);

  return <circle cx={cx + xOffset} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={0} />;
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
}

function ArmConfidenceInterval({
  xAxisMap,
  yAxisMap,
  chartData,
  armId,
  color,
  armIndex,
  totalArms,
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

  // Render confidence intervals for this arm at each data point
  return (
    <g>
      {chartData.map((dataPoint, pointIndex) => {
        const armData = dataPoint.armData.get(armId);
        if (!armData) return null;

        const x = xScale(dataPoint.date) + xOffset;
        const yLower = yScale(armData.lower);
        const yUpper = yScale(armData.upper);

        return (
          <g key={`ci-${armId}-${pointIndex}`}>
            {/* Vertical line from lower to upper CI */}
            <line x1={x} y1={yLower} x2={x} y2={yUpper} stroke={color} strokeWidth={1.5} opacity={0.6} />
            {/* Lower cap */}
            <line
              x1={x - capWidth / 2}
              y1={yLower}
              x2={x + capWidth / 2}
              y2={yLower}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.6}
            />
            {/* Upper cap */}
            <line
              x1={x - capWidth / 2}
              y1={yUpper}
              x2={x + capWidth / 2}
              y2={yUpper}
              stroke={color}
              strokeWidth={1.5}
              opacity={0.6}
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
  // Early return if no data
  if (!effectSizesOverTime || effectSizesOverTime.length === 0) {
    return <Text>No timeseries data to display</Text>;
  }

  const { chartData, armIds, armNames, armIsBaseline } = transformDataForChart(effectSizesOverTime);

  if (chartData.length === 0 || armIds.length === 0) {
    return <Text>No valid data points to display</Text>;
  }

  // Calculate Y-axis domain
  function getMinMaxY(
    data: TimeSeriesDataPoint[],
    armIds: string[],
    minYProp: number | undefined,
    maxYProp: number | undefined,
  ): [number, number] {
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const point of data) {
      for (const armId of armIds) {
        const armData = point.armData.get(armId);
        if (armData) {
          minY = Math.min(minY, armData.lower);
          maxY = Math.max(maxY, armData.upper);
        }
      }
    }

    // Apply provided bounds if available
    if (minYProp !== undefined) minY = Math.min(minY, minYProp);
    if (maxYProp !== undefined) maxY = Math.max(maxY, maxYProp);

    // Add 10% padding
    const range = maxY - minY;
    minY = minY - range * 0.1;
    maxY = maxY + range * 0.1;

    // Round to nice numbers if values are large
    if (Math.abs(minY) > 1 && Math.abs(maxY) > 1) {
      minY = Math.floor(minY);
      maxY = Math.ceil(maxY);
    }

    // Ensure non-zero range
    if (Math.abs(maxY - minY) < 0.0000001) {
      minY = minY - 1;
      maxY = maxY + 1;
    }

    return [minY, maxY];
  }

  const [minY, maxY] = getMinMaxY(chartData, armIds, minYProp, maxYProp);

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
          <XAxis dataKey="date" style={commonAxisStyle} />
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

          {/* Render lines for each arm */}
          {armIds.map((armId, index) => {
            const isBaseline = armIsBaseline.get(armId) || false;
            const color = getArmColor(index, isBaseline);
            return (
              <Line
                key={`${armId}_effect`}
                // type="monotone" - removed to allow jittered dots to be connected by straight lines
                dataKey={(point: TimeSeriesDataPoint) => point.armData.get(armId)?.estimate ?? null}
                name={armNames.get(armId) || armId}
                stroke={color}
                strokeWidth={2}
                dot={(props: unknown) => (
                  <JitteredDot
                    {...(props as JitteredDotProps)}
                    fill={color}
                    armIndex={index}
                    totalArms={armIds.length}
                  />
                )}
                activeDot={(props: unknown) => (
                  <JitteredDot
                    {...(props as JitteredDotProps)}
                    r={6}
                    fill={color}
                    armIndex={index}
                    totalArms={armIds.length}
                  />
                )}
                connectNulls={false}
                isAnimationActive={true}
              />
            );
          })}

          {/* Render confidence intervals for each arm */}
          {armIds.map((armId, index) => {
            const isBaseline = armIsBaseline.get(armId) || false;
            const color = getArmColor(index, isBaseline);
            return (
              <Customized
                key={`ci_${armId}`}
                component={
                  <ArmConfidenceInterval
                    chartData={chartData}
                    armId={armId}
                    color={color}
                    armIndex={index}
                    totalArms={armIds.length}
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
