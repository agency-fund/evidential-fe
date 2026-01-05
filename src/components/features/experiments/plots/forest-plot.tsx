'use client';
import { ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Box, Callout, Card, Flex, Heading, Text } from '@radix-ui/themes';
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
} from './forest-plot-utils';
import { useState } from 'react';

import { HorizontalConfidenceInterval } from './horizontal-confidence-interval';

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

// Define a type for the shape props that matches what we need; leverages the fact that
// type ScatterCustomizedShape accepts an ActiveShape, which allows for the signature:
//     ((props: unknown) => React.JSX.Element)
// Just list out what we need, inferred from inspecting props to this shape function.
type CustomShapeProps = {
  cx?: number;
  cy?: number;
  payload?: EffectSizeData | BanditEffectData;
  xAxis?: {
    width?: number;
  };
  yAxis?: {
    height?: number;
  };
};

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

// Simple truncation of long labels with an ellipsis for readability. ~42 roughly keeps the labels to 2 lines.
const truncateLabel = (label: string, maxChars: number = 42): string => {
  if (!label) return '';
  return label.length > maxChars ? label.slice(0, maxChars) + '…' : label;
};

const formatValue = (value: number): string => {
  // Show <= 2 decimal places only for values < 100
  return Math.abs(value) >= 100 || value === 0
    ? value.toFixed()
    : Math.abs(value) >= 1
      ? value.toFixed(1)
      : value.toFixed(2);
};

type TooltipState = {
  active: boolean;
  payload: EffectSizeData | BanditEffectData | null;
};

// Custom tooltip content is normally passed TooltipContentProps. We also want to pass in our custom
// TooltipState to allow overriding the payload (if the user mouseover's a CI) that would otherwise
// be associated with the scatterchart data's activeIndex.
type CustomTooltipProps = TooltipContentProps<ValueType, NameType> & Partial<{ state: TooltipState }>;

function CustomTooltip({ active, payload, state }: CustomTooltipProps) {
  // If our custom state is overriding things, it must be active.
  if (state && !state.active) return null;
  // Else if we're using default props, it must be active.
  if (!state && (!active || !payload || !payload.length)) return null;

  // Use the payload from our state if it exists, otherwise the default props payload.
  const data = state?.payload ?? payload[0].payload;

  if (isFrequentistPayload(data)) {
    return (
      <Card style={{ padding: '8px' }}>
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
      <Card style={{ padding: '8px' }}>
        <Flex direction="column" gap="2">
          <Text weight="bold">{data.armName}</Text>
          <Text>Mean outcome value: {data.postPredMean.toFixed(2)}</Text>
          <Text>Std. dev: {data.postPredStd.toFixed(2)}</Text>
          <Text>
            95% CI: [{data.postPredCI95Lower.toFixed(2)}, {data.postPredCI95Upper.toFixed(2)}]
          </Text>
        </Flex>
      </Card>
    );
  }
}

export function ForestPlot({ effectSizes, banditEffects, minX: minXProp, maxX: maxXProp }: ForestPlotProps) {
  // Our custom state gives us more control over the data to use in the tooltip vs the default props.
  const [tooltipState, setTooltipState] = useState<TooltipState>({ active: false, payload: null });

  const handleShowTooltip = (payload: EffectSizeData | BanditEffectData | null) => {
    console.log('handleShowTooltip for ', payload);
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

  // Flatten effect sizes into array of CI bounds for axis calculation
  const xAxisValues =
    effectSizes !== undefined
      ? effectSizes.flatMap((d) => [d.ci95Lower, d.ci95Upper])
      : banditEffects!.flatMap((d) => [
          Math.min(d.postPredabsCI95Lower, d.priorPredabsCI95Lower),
          Math.max(d.postPredabsCI95Upper, d.priorPredabsCI95Upper),
        ]);
  const [minX, maxX] = computeAxisBounds(xAxisValues, minXProp, maxXProp);

  // Space ticks evenly across the domain, including 0, but filter out duplicates,
  // which can occur when the effect is 0.
  const xGridPoints = [0, ...[0, 1, 2, 3, 4].map((i) => minX + (i * (maxX - minX)) / 4)]
    .sort((a, b) => a - b)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Scale a half-confidence interval to a width in viewport units to be used for drawing the error bars
  const scaleHalfIntervalToViewport = (x: number, width: number | undefined) => {
    if (!width) return 0;
    if (maxX - minX === 0) return 0;
    return (x / (maxX - minX)) * width;
  };

  const commonAxisStyle = {
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
  };

  // Adjust plot height based on the number of arms.
  const lenEffects = effectSizes !== undefined ? effectSizes.length : banditEffects!.length;
  const plotHeightPx = Math.max(220, 64 * lenEffects);
  // Coarse adjustment of the width of the left Y-axis based on the length of the arm names.
  const maxArmNameLength =
    effectSizes !== undefined
      ? effectSizes.reduce((max, e) => Math.max(max, e.armName.length), 0)
      : banditEffects!.reduce((max, e) => Math.max(max, e.armName.length), 0);
  const yRightAxisWidthPx = 80;
  const yLeftAxisWidthPx = maxArmNameLength > 20 ? 180 : 80;

  if (effectSizes !== undefined) {
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

        <Box height={`${plotHeightPx}px`}>
          <Heading size="2" align="center">
            Difference from {effectSizes[0].armName}
          </Heading>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart onMouseLeave={handleHideTooltip}>
              {/* Handle explicit display of the tooltip to allow selecting and copying values. */}
              <Tooltip
                active={tooltipState.active}
                defaultIndex={0} // need a default to still show content if we first mouseover a CI instead of data point
                wrapperStyle={{ pointerEvents: 'auto' }}
                content={(props) => <CustomTooltip {...props} state={tooltipState} />}
              />

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="absDifference"
                interval={0} // always show our ticks, to ensure the 0-point is always visible
                scale="linear"
                domain={[minX, maxX]}
                style={commonAxisStyle}
                ticks={xGridPoints} // use our own ticks due to auto rendering issues
                tickFormatter={formatValue}
              />

              {/* Use the left y-axis to display arm names */}
              <YAxis
                type="category"
                yAxisId="left"
                orientation="left"
                width={yLeftAxisWidthPx}
                style={commonAxisStyle}
                dataKey={(dataPoint: EffectSizeData) => dataPoint.armName}
              />

              {/* Use the right y-axis to display differences from the baseline */}
              <YAxis
                type="category"
                yAxisId="right"
                orientation="right"
                width={yRightAxisWidthPx}
                style={commonAxisStyle}
                // ticks={effectSizes.map((_, i) => `${i}`)}
                dataKey={(dataPoint: EffectSizeData) => {
                  return dataPoint.isBaseline ? '' : `Δ = ${formatValue(dataPoint.absDifference)}`;
                }}
              />

              {/* Control arm mean - vertical marker below points and CIs */}
              <ReferenceLine x={0} yAxisId="left" stroke={COLORS.BASELINE} strokeWidth={6} strokeDasharray="2 1" />

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
                    lower={d.ci95Lower}
                    upper={d.ci95Upper}
                    armName={d.armName}
                    strokeColor={strokeColor}
                    onMouseEnter={() => handleShowTooltip(d)}
                    yAxisId="left"
                  />
                );
              })}

              {/* Points showing the arm mean differences from the baseline, and the baseline reference mean */}
              <Scatter
                onMouseEnter={handleShowTooltip}
                // onMouseLeave={handleHideTooltip}
                data={effectSizes}
                dataKey={(dataPoint: EffectSizeData) => dataPoint.absDifference}
                yAxisId="left"
                shape={(props: CustomShapeProps) => {
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

              {/* "hidden" points backing the right y-axis for deltas */}
              <Scatter
                data={effectSizes}
                dataKey={(dataPoint: EffectSizeData) => dataPoint.absDifference}
                yAxisId="right"
                fill="none"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
    );
  } else if (banditEffects !== undefined) {
    return (
      <Flex direction="column" gap="3">
        <Box height={`${plotHeightPx}px`}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              {/* Handle explicit display of the tooltip to allow selecting and copying values. */}
              <Tooltip
                active={tooltipState.active}
                wrapperStyle={{ pointerEvents: 'auto' }}
                content={(props) => <CustomTooltip {...props} />}
              />

              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="postPredMean"
                interval="preserveStartEnd"
                scale="linear"
                domain={[minX, maxX]}
                style={commonAxisStyle}
                ticks={xGridPoints} // use our own ticks due to auto rendering issues
                tickFormatter={formatValue}
              />
              <YAxis
                type="category"
                domain={banditEffects.map((_, i) => i)}
                width={yLeftAxisWidthPx}
                style={commonAxisStyle}
                tickFormatter={(index) => {
                  const name = index >= 0 && index < banditEffects.length ? banditEffects[index].armName : '';
                  return truncateLabel(name);
                }}
                allowDataOverflow={true}
              />

              {/* Control arm mean - vertical marker below points and CIs */}
              <Scatter
                onMouseEnter={handleShowTooltip}
                onMouseLeave={handleHideTooltip}
                data={banditEffects}
                fill="none"
                shape={(props: CustomShapeProps) => {
                  // Always return an element even if empty.
                  const { cx: centerX, yAxis } = props;

                  return (
                    <line
                      x1={centerX}
                      y1={0}
                      x2={centerX}
                      y2={(yAxis?.height || 0) + 20} // where's the extra 20 from? Margins?
                      stroke={COLORS.BASELINE}
                      strokeWidth={5}
                      strokeDasharray="2 1"
                    />
                  );
                }}
              />

              {/* Confidence intervals - place under points */}
              <Scatter
                onMouseEnter={handleShowTooltip}
                onMouseLeave={handleHideTooltip}
                data={banditEffects}
                fill="none"
                // Draw a custom line for CIs since ErrorBars don't give us enough control
                shape={(props: CustomShapeProps) => {
                  // Always return an element even if empty.
                  if (!props.payload || !props.xAxis?.width) return <g />;

                  const { postPredCI95 } = props.payload as BanditEffectData;
                  const {
                    cx: centerX,
                    cy: centerY,
                    xAxis: { width: xAxisWidth },
                  } = props;

                  // Determine stroke color based on significance and direction
                  const strokeColor: string = COLORS.DEFAULT_CI;
                  return (
                    <line
                      x1={(centerX || 0) - scaleHalfIntervalToViewport(postPredCI95, xAxisWidth)}
                      y1={centerY}
                      x2={(centerX || 0) + scaleHalfIntervalToViewport(postPredCI95, xAxisWidth)}
                      y2={centerY}
                      stroke={strokeColor}
                      strokeWidth={12}
                      strokeLinecap="round"
                    />
                  );
                }}
              />

              {/* Points showing the arm mean outcomes. */}
              <Scatter
                onMouseEnter={handleShowTooltip}
                onMouseLeave={handleHideTooltip}
                data={banditEffects}
                shape={(props: CustomShapeProps) => {
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
