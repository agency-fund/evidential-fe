'use client';
import { ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Box, Callout, Card, Flex, Heading, Text } from '@radix-ui/themes';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { ChartOffset } from 'recharts/types/util/types';
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

function CustomTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  if (isFrequentistPayload(data)) {
    return (
      <Card style={{ padding: '8px' }}>
        <Text weight="bold">{data.armName}</Text>
        <Flex direction="row" gap="2">
          <Flex direction="column" gap="2" align="end">
            <Text>Difference: </Text>
            <Text>95% CI: </Text>
            <Text>p-value: </Text>
            <Text>Abs. mean: </Text>
          </Flex>
          <Flex direction="column" gap="2">
            <Text>
              {data.absDifference.toFixed(2)}
              {
                !data.isBaseline && (isFinite(data.relEffectPct) ? ` (${data.relEffectPct.toFixed(1)}%)` : ' (--%)') // Can't calculate a % change if the baseline is 0
              }
            </Text>
            <Text>
              [{data.ci95Lower.toFixed(2)}, {data.ci95Upper.toFixed(2)}]
            </Text>
            <Text weight={data.significant ? 'bold' : undefined}>
              {data.pValue !== null ? data.pValue.toFixed(3) : '--'}
            </Text>
            <Text>{data.absEffect.toFixed(2)}</Text>
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

  // Space 3 ticks evenly across the domain, but filter out duplicates,
  // which can occur when the effect is 0.
  const xGridPoints = [0, 1, 2, 3, 4]
    .map((i) => minX + (i * (maxX - minX)) / 4)
    .filter((value, index, self) => self.indexOf(value) === index);

  // Scale xGridPoints to viewport units for use in drawing grid lines
  const scaleXGridPoints = (props: { xAxis: unknown; width: number; height: number; offset: ChartOffset }) => {
    const { width, offset } = props;
    if (maxX - minX === 0) return []; // zero effect size so no grid lines
    return xGridPoints.map((x) =>
      Math.round((offset.left || 0) + ((x - minX) / (maxX - minX)) * (offset.width || width)),
    );
  };

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
  const plotHeightPx = Math.max(160, 64 * lenEffects);
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
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              {/* Supply our own coordinates generator since default rendering is off for proportion metrics */}
              <CartesianGrid strokeDasharray="3 3" verticalCoordinatesGenerator={scaleXGridPoints} />
              <XAxis
                type="number"
                dataKey="absDifference"
                interval="preserveStartEnd"
                scale="linear"
                domain={[minX, maxX]}
                style={commonAxisStyle}
                ticks={xGridPoints} // use our own ticks due to auto rendering issues
                tickFormatter={(value) =>
                  // Show <= 2 decimal places only for values < 10
                  Math.abs(value) >= 10 || value === 0
                    ? value.toFixed()
                    : Math.abs(value) >= 1
                      ? value.toFixed(1)
                      : value.toFixed(2)
                }
              />
              {/* Use the left y-axis to display arm names */}
              <YAxis
                type="category"
                domain={effectSizes.map((e, i) => i)}
                width={yLeftAxisWidthPx}
                style={commonAxisStyle}
                tickFormatter={(index) => {
                  const name = index >= 0 && index < effectSizes.length ? effectSizes[index].armName : '';
                  return truncateLabel(name);
                }}
                allowDataOverflow={true}
              />
              {/* Use the right y-axis to display differences from the baseline and p-values */}
              <YAxis
                yAxisId="stats"
                type="category"
                orientation="right"
                domain={effectSizes.map((e, i) => i)}
                width={yRightAxisWidthPx}
                tick={(props) => {
                  const {
                    payload: { value: effectSizesIndex },
                  } = props;
                  const armData = effectSizes[effectSizesIndex];

                  const absoluteDiffText = !armData.isBaseline ? `Δ = ${armData.absDifference.toFixed(1)}` : '';

                  const commonRightAxisTextProps = {
                    x: props.x,
                    textAnchor: props.textAnchor,
                    // Only bold/black if significant AND not baseline arm
                    fill: armData.significant && !armData.isBaseline ? 'black' : undefined,
                    fontWeight: armData.significant && !armData.isBaseline ? 'bold' : undefined,
                  };

                  return (
                    <g>
                      <text {...commonRightAxisTextProps} style={commonAxisStyle} y={props.y} dominantBaseline="middle">
                        {absoluteDiffText}
                      </text>
                    </g>
                  );
                }} // end tickFormatter, whew
                allowDataOverflow={true}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Control arm mean - vertical marker below points and CIs */}
              <Scatter
                data={effectSizes}
                fill="none"
                // Draw a custom SVG line for CIs since ErrorBars don't give us enough control
                shape={(props: CustomShapeProps) => {
                  // Always return an element even if empty.
                  if (!(props.payload as EffectSizeData)?.isBaseline) return <g />;

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
                data={effectSizes}
                fill="none"
                // Draw a custom line for CIs since ErrorBars don't give us enough control
                shape={(props: unknown) => {
                  const shapeProps = props as CustomShapeProps;
                  // Always return an element even if empty.
                  if (!shapeProps.payload || !shapeProps.xAxis?.width) return <g />;

                  const { isBaseline, ci95, absDifference, significant } = shapeProps.payload as EffectSizeData;
                  const {
                    cx: centerX,
                    cy: centerY,
                    xAxis: { width: xAxisWidth },
                  } = shapeProps;

                  // Determine stroke color based on significance and direction
                  let strokeColor: string = COLORS.DEFAULT_CI;
                  if (significant && !isBaseline) {
                    strokeColor = absDifference > 0 ? COLORS.POSITIVE_CI : COLORS.NEGATIVE_CI;
                  }
                  return isNaN(ci95) ? (
                    <g />
                  ) : (
                    <line
                      x1={(centerX || 0) - scaleHalfIntervalToViewport(ci95, xAxisWidth)}
                      y1={centerY}
                      x2={(centerX || 0) + scaleHalfIntervalToViewport(ci95, xAxisWidth)}
                      y2={centerY}
                      stroke={strokeColor}
                      strokeWidth={12}
                      strokeLinecap="round"
                    />
                  );
                }}
              />

              {/* Arm mean differences from the baseline - points */}
              <Scatter
                data={effectSizes}
                shape={(props: CustomShapeProps) => {
                  // Always return an element even if empty.
                  if (!props.payload) return <g />;

                  const { significant, isBaseline, absDifference, isMissingAllValues } =
                    props.payload as EffectSizeData;
                  const { cx: centerX, cy: centerY } = props;

                  let fillColor: string = COLORS.DEFAULT;
                  if (significant && !isBaseline) {
                    fillColor = absDifference > 0 ? POSITIVE_LIGHT_COLOR : COLORS.NEGATIVE_DIFF;
                  }
                  if (isMissingAllValues) {
                    return <g />;
                  }
                  if (isBaseline) {
                    // Mark the control arm with a larger diamond shape
                    return (
                      <polygon
                        points={createDiamondShape(centerX, centerY, 8)}
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
  } else if (banditEffects !== undefined) {
    return (
      <Flex direction="column" gap="3">
        <Box height={`${plotHeightPx}px`}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              {/* Supply our own coordinates generator since default rendering is off for ratio metrics */}
              <CartesianGrid strokeDasharray="3 3" verticalCoordinatesGenerator={scaleXGridPoints} />
              <XAxis
                type="number"
                dataKey="postPredMean"
                interval="preserveStartEnd"
                scale="linear"
                domain={[minX, maxX]}
                style={commonAxisStyle}
                ticks={xGridPoints} // use our own ticks due to auto rendering issues
                tickFormatter={(value) =>
                  // Show <= 2 decimal places only for values < 10
                  Math.abs(value) >= 10 || value === 0
                    ? value.toFixed()
                    : Math.abs(value) >= 1
                      ? value.toFixed(1)
                      : value.toFixed(2)
                }
              />
              <YAxis
                type="category"
                domain={banditEffects.map((e, i) => i)}
                // hide={true} - use ticks for arm names
                width={yLeftAxisWidthPx}
                style={commonAxisStyle}
                tickFormatter={(index) => {
                  const name = index >= 0 && index < banditEffects.length ? banditEffects[index].armName : '';
                  return truncateLabel(name);
                }}
                allowDataOverflow={true} // bit of a hack since the ErrorBar is internally messing with the y-axis domain
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Confidence intervals - place under points */}
              <Scatter
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
                      strokeWidth={5}
                      strokeLinecap="round"
                    />
                  );
                }}
              ></Scatter>

              {/* All arms */}
              <Scatter
                data={banditEffects}
                shape={(props: CustomShapeProps) => {
                  // Always return an element even if empty.
                  if (!props.payload) return <g />;

                  const { cx: centerX, cy: centerY } = props;
                  const fillColor: string = COLORS.DEFAULT;

                  return <circle cx={centerX} cy={centerY} r={5} fill={fillColor} stroke={COLORS.DEFAULT} />;
                }}
              />

              {/* Control arm mean - vertical marker */}
              <Scatter
                data={banditEffects}
                fill="none"
                // Draw a custom SVG line for CIs since ErrorBars don't give us enough control
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
                      strokeDasharray="1 1"
                      opacity={0.2}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
    );
  } else return null;
}
