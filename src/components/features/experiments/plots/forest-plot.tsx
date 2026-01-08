'use client';
import { ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Box, Callout, Card, Flex, Heading, Separator, Text } from '@radix-ui/themes';
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  BanditEffectData,
  EffectSizeData,
  computeAxisBounds,
  BASELINE_INDICATOR_COLOR,
  CONTROL_COLOR,
  DEFAULT_POINT_COLOR,
  POSITIVE_COLOR,
  NEGATIVE_COLOR,
  POSITIVE_LIGHT_COLOR,
  NEGATIVE_LIGHT_COLOR,
  COMMON_AXIS_STYLE,
} from './forest-plot-utils';
import { useState } from 'react';

import { HorizontalConfidenceInterval } from './horizontal-confidence-interval';
import { ScatterPointItem } from 'recharts/types/cartesian/Scatter';

// Color constants
const COLORS = {
  DEFAULT: DEFAULT_POINT_COLOR,
  DEFAULT_CI: CONTROL_COLOR,
  BASELINE: BASELINE_INDICATOR_COLOR,
  POSITIVE_DIFF: POSITIVE_LIGHT_COLOR,
  POSITIVE_CI: POSITIVE_COLOR,
  NEGATIVE_DIFF: NEGATIVE_LIGHT_COLOR,
  NEGATIVE_CI: NEGATIVE_COLOR,
} as const;

interface ForestPlotProps {
  effectSizes?: EffectSizeData[];
  banditEffects?: BanditEffectData[];
  // If provided, use these values as hints for the x-axis domain.
  // May still be adjusted to accommodate the displayed effect sizes.
  minX?: number;
  maxX?: number;
}

const isFrequentistPayload = (payload: EffectSizeData | BanditEffectData): payload is EffectSizeData => {
  return 'isBaseline' in payload;
};

const isBanditPayload = (payload: EffectSizeData | BanditEffectData): payload is BanditEffectData => {
  return 'postPredMean' in payload;
};

// Function to create a diamond shape
const createDiamondShape = (cx: number = 0, cy: number = 0, size: number = 6) => {
  return `${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`;
};

const formatValue = (value: number): string => {
  // Show <= 2 decimal places only for values < 100
  return Math.abs(value) >= 100 || value === 0
    ? value.toFixed()
    : Math.abs(value) >= 1
      ? value.toFixed(1)
      : value.toFixed(2);
};

const formatPct = (value: number): string => {
  if (!isFinite(value)) return '--';
  return `${formatValue(value)}%`;
};

// Column widths for the custom tick table to align each tick's data since we can't use a grid.
const FREQ_COL_WIDTHS = {
  name: 88,
  mean: 72,
  diff: 72,
  pct: 64,
} as const;

// Column widths for bandit tick table (simpler: name, mean, std)
const BANDIT_COL_WIDTHS = {
  name: 88,
  mean: 72,
  std: 72,
} as const;

// Height of each row in the custom tick table.
const ROW_HEIGHT = 64;
// Height of the header attached to the topmost (last) row in the custom tick table.
const HEADER_HEIGHT = 26;
// Height of the XAxis for use in the total chart height calculation.
const X_AXIS_HEIGHT = 28;

// Calculate the total width of the tick table accounting for the override if provided.
function getTotalYAxisWidthPx(isFrequentist: boolean, nameWidthPxOverride?: number) {
  const nameWidth = nameWidthPxOverride ?? (isFrequentist ? FREQ_COL_WIDTHS.name : BANDIT_COL_WIDTHS.name);
  if (isFrequentist) {
    return FREQ_COL_WIDTHS.mean + FREQ_COL_WIDTHS.diff + FREQ_COL_WIDTHS.pct + nameWidth;
  }
  return BANDIT_COL_WIDTHS.mean + BANDIT_COL_WIDTHS.std + nameWidth;
}

// Unfortunately Recharts doesn't have an explicit type for the props it passes to a tick function.
// So just spread these on our custom tick component, by composing just the fields we use from
// Recharts, with extra props we want to pass to our component.
interface RechartsTickPropsWeUse {
  // {x,y} are pixel coordinates for the start of the tick for this row
  x?: number;
  y?: number;
  // The payload specified by the YAxis dataKey, i.e. the arm name.
  payload?: { value: string };
  // The index of the tick in the YAxis ticks array.
  index?: number;
}
// Additional props we want to pass along to CustomFreqYAxisTick
interface CustomFreqYAxisTickProps extends RechartsTickPropsWeUse {
  effectSizes: EffectSizeData[];
  isTopmost: boolean;
  // Override the width of the arm name column if desired.
  nameWidthPxOverride?: number;
}

// Custom Y-axis tick for frequentist plots that renders additional stats per arm in a tabular format.
function CustomFreqYAxisTick({
  x = 0,
  y = 0,
  payload,
  effectSizes,
  isTopmost,
  nameWidthPxOverride,
}: CustomFreqYAxisTickProps) {
  const armName = payload?.value ?? '';
  const armData = effectSizes.find((e) => e.armName === armName);
  if (!armData) return null;

  const isSignificantVariant = !armData.isBaseline && armData.significant;
  const significanceStyle = isSignificantVariant
    ? { color: armData.absDifference > 0 ? COLORS.POSITIVE_CI : COLORS.NEGATIVE_CI }
    : undefined;

  const nameWidthPx = nameWidthPxOverride ?? FREQ_COL_WIDTHS.name;
  const totalWidthPx = getTotalYAxisWidthPx(true, nameWidthPx);
  const startX = x - totalWidthPx;

  return (
    <g>
      {isTopmost && (
        // Position header row by specifying the top-left corner of the svg container and its size.
        <foreignObject x={startX} y={y - HEADER_HEIGHT - ROW_HEIGHT / 2} width={totalWidthPx} height={HEADER_HEIGHT}>
          <Box>
            <Flex align="center" justify="between" height="100%">
              <Box width={`${nameWidthPx}px`}>
                <Text size="2" weight="bold">
                  Arm
                </Text>
              </Box>
              <Box width={`${FREQ_COL_WIDTHS.mean}px`} pl="2">
                <Text size="2" weight="bold">
                  Mean
                </Text>
              </Box>
              <Box width={`${FREQ_COL_WIDTHS.diff}px`}>
                <Text size="2" weight="bold">
                  Diff
                </Text>
              </Box>
              <Box width={`${FREQ_COL_WIDTHS.pct}px`}>
                <Text size="2" weight="bold">
                  Diff %
                </Text>
              </Box>
            </Flex>
            <Separator size="4" style={{ height: '2px', backgroundColor: 'var(--gray-10)' }} />
          </Box>
        </foreignObject>
      )}

      <foreignObject x={startX} y={y - ROW_HEIGHT / 2} width={totalWidthPx} height={ROW_HEIGHT}>
        <Separator size="4" />
        <Flex align="center" height="100%">
          {/* Text truncate was not working nested under Box, so use a fix-width Flex */}
          <Flex width={`${nameWidthPx}px`}>
            <Text size="3" title={armName} truncate>
              {armName}
            </Text>
          </Flex>
          <Separator size="4" orientation="vertical" />
          <Box width={`${FREQ_COL_WIDTHS.mean}px`} pl="1">
            <Text size="3">{formatValue(armData.absEffect)}</Text>
          </Box>
          <Box width={`${FREQ_COL_WIDTHS.diff}px`}>
            <Text size="3">{armData.isBaseline ? '--' : formatValue(armData.absDifference)}</Text>
          </Box>
          <Box width={`${FREQ_COL_WIDTHS.pct}px`}>
            <Text size="3" weight={isSignificantVariant ? 'bold' : undefined} style={significanceStyle}>
              {armData.isBaseline ? '--' : formatPct(armData.relEffectPct)}
            </Text>
          </Box>
        </Flex>
      </foreignObject>
    </g>
  );
}

interface CustomBanditYAxisTickProps extends RechartsTickPropsWeUse {
  banditEffects: BanditEffectData[];
  isTopmost: boolean;
  nameWidthPxOverride?: number;
}

// Custom Y-axis tick for bandit plots that renders additional stats per arm in a tabular format.
function CustomBanditYAxisTick({
  x = 0,
  y = 0,
  payload,
  banditEffects,
  isTopmost,
  nameWidthPxOverride,
}: CustomBanditYAxisTickProps) {
  const armName = payload?.value ?? '';
  const armData = banditEffects.find((e) => e.armName === armName);
  if (!armData) return null;

  const nameWidthPx = nameWidthPxOverride ?? BANDIT_COL_WIDTHS.name;
  const totalWidthPx = getTotalYAxisWidthPx(false, nameWidthPx);
  const startX = x - totalWidthPx;

  return (
    <g>
      {isTopmost && (
        <foreignObject x={startX} y={y - HEADER_HEIGHT - ROW_HEIGHT / 2} width={totalWidthPx} height={HEADER_HEIGHT}>
          <Box>
            <Flex align="center" justify="between" height="100%">
              <Box width={`${nameWidthPx}px`}>
                <Text size="2" weight="bold">
                  Arm
                </Text>
              </Box>
              <Box width={`${BANDIT_COL_WIDTHS.mean}px`} pl="2">
                <Text size="2" weight="bold">
                  Mean
                </Text>
              </Box>
              <Box width={`${BANDIT_COL_WIDTHS.std}px`}>
                <Text size="2" weight="bold">
                  StdDev
                </Text>
              </Box>
            </Flex>
            <Separator size="4" style={{ height: '2px', backgroundColor: 'var(--gray-10)' }} />
          </Box>
        </foreignObject>
      )}

      <foreignObject x={startX} y={y - ROW_HEIGHT / 2} width={totalWidthPx} height={ROW_HEIGHT}>
        <Separator size="4" />
        <Flex align="center" height="100%">
          <Flex width={`${nameWidthPx}px`}>
            <Text size="3" title={armName} truncate>
              {armName}
            </Text>
          </Flex>
          <Separator size="4" orientation="vertical" />
          <Box width={`${BANDIT_COL_WIDTHS.mean}px`} pl="1">
            <Text size="3">{formatValue(armData.postPredMean)}</Text>
          </Box>
          <Box width={`${BANDIT_COL_WIDTHS.std}px`}>
            <Text size="3">{formatValue(armData.postPredStd)}</Text>
          </Box>
        </Flex>
      </foreignObject>
    </g>
  );
}

// Custom tooltip content is normally passed TooltipContentProps. We also want to pass in our custom
// TooltipState to allow overriding the payload (if the user mouseover's a CI) that would otherwise
// be associated with the scatterchart data's activeIndex.
type TooltipState = {
  active: boolean;
  payload: EffectSizeData | BanditEffectData | null;
};
type ExtraTooltipProps = {
  state: TooltipState;
  onMouseLeave: () => void; // to hide the tooltip when cursor hovers over then leaves the card
};
type CustomTooltipProps = TooltipContentProps<ValueType, NameType> & Partial<ExtraTooltipProps>;

function CustomTooltip({ active, payload, state, onMouseLeave }: CustomTooltipProps) {
  // If our custom state is overriding things, it must be active.
  if (state && !state.active) return null;
  // Else if we're using default props, it must be active.
  if (!state && (!active || !payload || !payload.length)) return null;

  // Use the payload from our state if it exists, otherwise the default props payload.
  const data = state?.payload ?? payload[0].payload;

  if (isFrequentistPayload(data)) {
    return (
      <Card onMouseLeave={onMouseLeave} style={{ padding: '8px' }}>
        <Text weight="bold">{data.armName}</Text>
        <Flex direction="row" gap="2">
          <Flex direction="column" gap="2" align="end">
            <Text>Arm Mean: </Text>
            {!data.isBaseline && <Text>Difference: </Text>}
            <Text>{data.isBaseline ? 'Mean 95% CI: ' : 'Diff 95% CI: '}</Text>
            <Text>Std. error: </Text>
            {!data.isBaseline && <Text>p-value: </Text>}
          </Flex>
          <Flex direction="column" gap="2">
            <Text>{formatValue(data.absEffect)}</Text>
            {!data.isBaseline && (
              <Text weight={data.significant ? 'bold' : undefined}>
                {formatValue(data.absDifference)}
                {isFinite(data.relEffectPct) ? ` (${formatValue(data.relEffectPct)}%)` : ' (--%)'}
              </Text>
            )}
            <Text>
              [{data.ci95Lower.toFixed(2)}, {data.ci95Upper.toFixed(2)}]
            </Text>
            <Text>{data.stdError ? formatValue(data.stdError) : '--'}</Text>
            {!data.isBaseline && <Text>{data.pValue?.toFixed(3) ?? '--'}</Text>}
          </Flex>
        </Flex>
      </Card>
    );
  } else if (isBanditPayload(data)) {
    return (
      <Card onMouseLeave={onMouseLeave} style={{ padding: '8px' }}>
        <Text weight="bold">{data.armName}</Text>
        <Flex direction="row" gap="2">
          <Flex direction="column" gap="2" align="end">
            <Text>Mean outcome: </Text>
            <Text>95% CI: </Text>
            <Text>Std. deviation: </Text>
          </Flex>
          <Flex direction="column" gap="2">
            <Text>{data.postPredMean.toFixed(2)}</Text>
            <Text>
              [{data.postPredCI95Lower.toFixed(2)}, {data.postPredCI95Upper.toFixed(2)}]
            </Text>
            <Text>{data.postPredStd.toFixed(2)}</Text>
          </Flex>
        </Flex>
      </Card>
    );
  }
}

export function ForestPlot({ effectSizes, banditEffects, minX: minXProp, maxX: maxXProp }: ForestPlotProps) {
  // Our custom state gives us more control over the data to use in the tooltip vs the default props.
  const [tooltipState, setTooltipState] = useState<TooltipState>({ active: false, payload: null });

  const handleShowTooltip = (payload: EffectSizeData | BanditEffectData | null) => {
    setTooltipState({ active: true, payload });
  };
  const handleHideTooltip = () => setTooltipState({ active: false, payload: null });

  // Only render if we have data
  if ((!effectSizes && !banditEffects) || (effectSizes?.length === 0 && banditEffects?.length === 0)) {
    return (
      <Callout.Root color={'orange'}>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>No analysis to display yet.</Callout.Text>
      </Callout.Root>
    );
  }

  const isFrequentist = effectSizes !== undefined;
  const isBandit = banditEffects !== undefined;

  // Flatten effect sizes into array of CI bounds for axis calculation
  const xAxisValues = isFrequentist
    ? effectSizes.flatMap((d) => [d.ci95Lower, d.ci95Upper])
    : banditEffects!.flatMap((d) => [
        Math.min(d.postPredabsCI95Lower, d.priorPredabsCI95Lower),
        Math.max(d.postPredabsCI95Upper, d.priorPredabsCI95Upper),
      ]);
  const [minX, maxX] = computeAxisBounds(xAxisValues, minXProp, maxXProp);

  // Space ticks evenly across the domain. For frequentist plots also include 0,
  // but filter out duplicates, which can occur when the effect is 0.
  const basePoints = isFrequentist ? [0] : [];
  const xGridPoints = [...basePoints, ...[0, 1, 2, 3, 4].map((i) => minX + (i * (maxX - minX)) / 4)]
    .sort((a, b) => a - b)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Adjust plot height based on the number of arms.
  const lenEffects = isFrequentist ? effectSizes.length : banditEffects!.length;
  const chartHeightPx = ROW_HEIGHT * lenEffects + HEADER_HEIGHT + X_AXIS_HEIGHT;

  // Coarse adjustment of the width of the left Y-axis based on the length of the arm names.
  const maxArmNameLength = isFrequentist
    ? effectSizes.reduce((max, e) => Math.max(max, e.armName.length), 0)
    : banditEffects!.reduce((max, e) => Math.max(max, e.armName.length), 0);
  const maxNamePx = maxArmNameLength > 20 ? 180 : undefined;
  // Use wider axis to accommodate the table display, with extra padding for the actual tick.
  const yLeftAxisWidthPx = 10 + getTotalYAxisWidthPx(isFrequentist, maxNamePx);

  if (isFrequentist) {
    // Filter arms with issues and create specific messages for each
    const armsWithIssues = effectSizes.filter((e) => e.isMissingAllValues || e.invalidStatTest);
    return (
      <Flex direction="column" gap="3">
        {armsWithIssues.map((arm) => (
          <Callout.Root key={arm.armId} color="orange" size="1">
            <Callout.Icon>
              <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>
              {arm.isMissingAllValues ? (
                <>
                  <Text weight="bold">{arm.armName}</Text>: assignments have no valid values for this metric. Please
                  wait for values to be collected.
                </>
              ) : (
                <>
                  <Text weight="bold">{arm.armName}</Text>: has invalid statistical results. The experiment might not
                  have enough data or no variation in the metric right now.
                </>
              )}
            </Callout.Text>
          </Callout.Root>
        ))}

        <Box height={`${chartHeightPx}px`}>
          <Heading size="2" align="center">
            Difference from {effectSizes[0].armName}
          </Heading>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart onMouseLeave={handleHideTooltip} margin={{ top: HEADER_HEIGHT, right: 32 }}>
              {/* Handle explicit display of the tooltip to allow selecting and copying values. */}
              <Tooltip
                active={tooltipState.active}
                defaultIndex={0} // need a default to still show content if we first mouseover a CI instead of data point
                wrapperStyle={{ pointerEvents: 'auto' }}
                content={(props) => <CustomTooltip {...props} state={tooltipState} onMouseLeave={handleHideTooltip} />}
              />

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="absDifference"
                interval={0} // always show our ticks, to ensure the 0-point is always visible
                scale="linear"
                domain={[minX, maxX]}
                style={COMMON_AXIS_STYLE}
                ticks={xGridPoints} // use our own ticks due to auto rendering issues
                tickFormatter={formatValue}
              />

              {/* Use the left y-axis to display arm names with stats table */}
              <YAxis
                type="category"
                yAxisId="left"
                orientation="left"
                width={yLeftAxisWidthPx}
                style={COMMON_AXIS_STYLE}
                dataKey={(dataPoint: EffectSizeData) => dataPoint.armName}
                tick={(props: RechartsTickPropsWeUse) => {
                  // The topmost tick is the last one in the effectSizes array (highest y position = lowest index in render order)
                  const isTopmost = props.index === effectSizes.length - 1;
                  return (
                    <CustomFreqYAxisTick
                      {...props}
                      effectSizes={effectSizes}
                      isTopmost={isTopmost}
                      nameWidthPxOverride={maxNamePx}
                    />
                  );
                }}
              />

              {/* Control arm mean - vertical marker below points and CIs */}
              <ReferenceLine
                x={0}
                yAxisId="left"
                stroke={COLORS.BASELINE}
                strokeWidth={6}
                strokeDasharray="2 1"
                onMouseEnter={() => handleShowTooltip(effectSizes[0])}
              />

              {/* Confidence intervals - place under points */}
              {effectSizes.map((d) => {
                // Skip rendering if missing data or is baseline, since we're highlighting *differences* from the baseline.
                if (isNaN(d.ci95) || d.isBaseline) return null;
                let strokeColor: string = COLORS.DEFAULT_CI;
                if (d.significant && !d.isBaseline) {
                  strokeColor = d.absDifference > 0 ? COLORS.POSITIVE_CI : COLORS.NEGATIVE_CI;
                }
                return (
                  <HorizontalConfidenceInterval
                    key={d.armId}
                    armName={d.armName}
                    lower={d.ci95Lower}
                    upper={d.ci95Upper}
                    strokeColor={strokeColor}
                    onMouseEnter={() => handleShowTooltip(d)}
                    yAxisId="left"
                  />
                );
              })}

              {/* Points showing the arm mean differences from the baseline, and the baseline reference mean */}
              <Scatter
                onMouseEnter={handleShowTooltip}
                data={effectSizes}
                dataKey={(dataPoint: EffectSizeData) => dataPoint.absDifference}
                yAxisId="left"
                shape={(props: ScatterPointItem) => {
                  // Always return an element even if empty.
                  if (!props.payload) return <g />;
                  const { significant, isBaseline, absDifference, isMissingAllValues } =
                    props.payload as EffectSizeData;
                  if (isMissingAllValues) return <g />;

                  const { cx: centerX, cy: centerY } = props;
                  let fillColor: string = COLORS.DEFAULT;
                  if (significant && !isBaseline) {
                    fillColor = absDifference > 0 ? POSITIVE_LIGHT_COLOR : COLORS.NEGATIVE_DIFF;
                  }
                  if (isBaseline) {
                    // Mark the control arm with a larger diamond shape
                    return (
                      <polygon
                        points={createDiamondShape(centerX, centerY, 9)}
                        fill={COLORS.DEFAULT}
                        stroke={COLORS.DEFAULT_CI}
                      />
                    );
                  }
                  return <circle cx={centerX} cy={centerY} r={6} fill={fillColor} stroke={COLORS.DEFAULT_CI} />;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
    );
  } else if (isBandit) {
    return (
      <Flex direction="column" gap="3">
        <Box height={`${chartHeightPx}px`}>
          <Heading size="2" align="center">
            Estimated Average Outcomes Given Observations So Far
          </Heading>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart onMouseLeave={handleHideTooltip} margin={{ top: HEADER_HEIGHT, right: 32 }}>
              {/* Handle explicit display of the tooltip to allow selecting and copying values. */}
              <Tooltip
                active={tooltipState.active}
                defaultIndex={0} // need a default to still show content if we first mouseover a CI instead of data point
                wrapperStyle={{ pointerEvents: 'auto' }}
                content={(props) => <CustomTooltip {...props} state={tooltipState} onMouseLeave={handleHideTooltip} />}
              />

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="postPredMean"
                interval="preserveStartEnd"
                scale="linear"
                domain={[minX, maxX]}
                style={COMMON_AXIS_STYLE}
                ticks={xGridPoints} // use our own ticks due to auto rendering issues
                tickFormatter={formatValue}
              />
              <YAxis
                type="category"
                yAxisId="left"
                orientation="left"
                width={yLeftAxisWidthPx}
                style={COMMON_AXIS_STYLE}
                dataKey={(dataPoint: BanditEffectData) => dataPoint.armName}
                tick={(props: RechartsTickPropsWeUse) => {
                  const isTopmost = props.index === banditEffects.length - 1;
                  return (
                    <CustomBanditYAxisTick
                      {...props}
                      banditEffects={banditEffects}
                      isTopmost={isTopmost}
                      nameWidthPxOverride={maxNamePx}
                    />
                  );
                }}
              />

              {/* arm mean markers - vertical marker below points and CIs */}
              {banditEffects.map((e) => (
                <ReferenceLine
                  key={e.armId}
                  x={e.postPredMean}
                  yAxisId="left"
                  stroke={COLORS.BASELINE}
                  strokeWidth={6}
                  strokeDasharray="2 1"
                />
              ))}

              {/* Confidence intervals - place under points */}
              {banditEffects.map((e) => {
                const strokeColor: string = COLORS.DEFAULT_CI;
                return (
                  <HorizontalConfidenceInterval
                    key={e.armId}
                    armName={e.armName}
                    lower={e.postPredCI95Lower}
                    upper={e.postPredCI95Upper}
                    strokeColor={strokeColor}
                    onMouseEnter={() => handleShowTooltip(e)}
                    yAxisId="left"
                  />
                );
              })}

              {/* Points showing the arm mean outcomes. */}
              <Scatter
                onMouseEnter={handleShowTooltip}
                data={banditEffects}
                dataKey={(dataPoint: BanditEffectData) => dataPoint.postPredMean}
                yAxisId="left"
                shape={(props: ScatterPointItem) => {
                  // Always return an element even if empty.
                  if (!props.payload) return <g />;

                  const { cx: centerX, cy: centerY } = props;
                  const fillColor: string = COLORS.DEFAULT;

                  return <circle cx={centerX} cy={centerY} r={6} fill={fillColor} stroke={COLORS.DEFAULT_CI} />;
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
    );
  } else return null;
}
