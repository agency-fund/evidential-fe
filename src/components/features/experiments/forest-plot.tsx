'use client';
import {
  AssignSummary,
  MetricAnalysis,
  OnlineFrequentistExperimentSpecOutput,
  PreassignedFrequentistExperimentSpecOutput,
} from '@/api/methods.schemas';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Box, Callout, Card, Flex, Text } from '@radix-ui/themes';
import { MdeBadge } from '@/components/features/experiments/mde-badge';
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

// Color constants
const COLORS = {
  DEFAULT: '#bbbbbb', // Lighter gray for default/control
  DEFAULT_CI: '#757575', // Gray for default stroke
  BASELINE: '#7575ff', // baseline vertical indicator
  POSITIVE: '#00c853', // Green for positive effects
  NEGATIVE: '#ff5252', // Red for negative effects
} as const;

interface EffectSizeData {
  isBaseline: boolean;
  armId: string;
  armName: string;
  baselineEffect: number;
  effect: number;
  absEffect: number;
  ci95Lower: number;
  ci95Upper: number;
  ci95: number;
  absCI95Lower: number;
  absCI95Upper: number;
  pValue: number | null;
  invalidStatTest: boolean;
  significant: boolean;
  sampleSize: number;
  totalSampleSize: number;
}

interface ForestPlotProps {
  analysis: MetricAnalysis;
  assignSummary: AssignSummary;
  designSpec: OnlineFrequentistExperimentSpecOutput | PreassignedFrequentistExperimentSpecOutput;
}

// Define a type for the shape props that matches what we need; leverages the fact that
// type ScatterCustomizedShape accepts an ActiveShape, which allows for the signature:
//     ((props: unknown) => React.JSX.Element)
// Just list out what we need, inferred from inspecting props to this shape function.
type CustomShapeProps = {
  cx?: number;
  cy?: number;
  payload?: EffectSizeData;
  xAxis?: {
    width?: number;
  };
  yAxis?: {
    height?: number;
  };
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
  const percentChange = (((data.absEffect - data.baselineEffect) / data.baselineEffect) * 100).toFixed(1);
  return (
    <Card style={{ padding: '8px' }}>
      <Flex direction="column" gap="2">
        <Text weight="bold">{data.armName}</Text>
        <Text>Effect: {data.absEffect.toFixed(2)}</Text>
        {data.isBaseline ? null : <Text>vs baseline: {percentChange}%</Text>}
        <Text>
          95% CI: [{data.absCI95Lower.toFixed(2)}, {data.absCI95Upper.toFixed(2)}]
        </Text>
      </Flex>
    </Card>
  );
}

export function ForestPlot({ analysis, designSpec, assignSummary }: ForestPlotProps) {
  // Get total sample size from assign summary
  const availableN = assignSummary.sample_size;

  // Extract data for visualization
  const controlArmIndex = analysis.arm_analyses.findIndex((a) => a.is_baseline);
  const controlArmAnalysis = analysis.arm_analyses[controlArmIndex];
  const controlEstimate = controlArmAnalysis.estimate; // regression intercept

  // Our data structure for Recharts
  const effectSizes: EffectSizeData[] = analysis.arm_analyses.map((armAnalysis, index) => {
    const isBaseline = armAnalysis.is_baseline;
    const armId = armAnalysis.arm_id || 'MISSING_ARM_ID'; // should be impossible
    const armSize = assignSummary.arm_sizes?.find((a) => a.arm.arm_id === armId)?.size || 0;

    const estimate = armAnalysis.estimate; // regression coefficient
    const stdError = armAnalysis.std_error;
    const pValue = armAnalysis.p_value;
    const tStat = armAnalysis.t_stat;
    const invalidStatTest = pValue === null || pValue === undefined || tStat === null || tStat === undefined;

    // Calculate 95% confidence interval
    const ci95 = 1.96 * stdError;
    const ci95Lower = estimate - ci95;
    const ci95Upper = estimate + ci95;
    const absEffect = estimate + (isBaseline ? 0 : controlEstimate);
    const absCI95Lower = ci95Lower + (isBaseline ? 0 : controlEstimate);
    const absCI95Upper = ci95Upper + (isBaseline ? 0 : controlEstimate);

    return {
      isBaseline,
      armId,
      armName: armAnalysis.arm_name || `Arm ${index}`,
      baselineEffect: controlEstimate,
      effect: estimate, // relative to baseline effect
      absEffect: absEffect,
      ci95Lower,
      ci95Upper,
      ci95: ci95, // for symmetric ErrorBars
      absCI95Lower,
      absCI95Upper,
      pValue,
      invalidStatTest,
      significant: !!(pValue && pValue < (designSpec.alpha || 0.05)),
      sampleSize: armSize,
      totalSampleSize: availableN,
    };
  });

  // Only render if we have data
  if (effectSizes.length === 0) {
    return <Text>No treatment arms to display</Text>;
  }

  // Get the min and max x-axis values in metric units to use in our charts.
  function getMinMaxX(effectSizes: EffectSizeData[]) {
    let minX = Math.min(...effectSizes.map((d) => d.absCI95Lower));
    let maxX = Math.max(...effectSizes.map((d) => d.absCI95Upper));
    const viewportWidth = maxX - minX;
    minX = minX - viewportWidth * 0.1;
    maxX = maxX + viewportWidth * 0.1;
    if (Math.abs(minX) > 1 && Math.abs(maxX) > 1) {
      minX = Math.floor(minX);
      maxX = Math.ceil(maxX);
    }
    // If the domain appears to be essentially a singular value, make it larger to avoid a 0-width.
    if (Math.abs(minX - maxX) < 0.0000001) {
      minX = minX - 1;
      maxX = maxX + 1;
    }
    return [minX, maxX];
  }

  const [minX, maxX] = getMinMaxX(effectSizes);
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

  let mdePct: string | null;
  if (analysis.metric?.metric_pct_change) {
    mdePct = (analysis.metric?.metric_pct_change * 100).toFixed(1);
  } else {
    mdePct = null;
  }

  const commonAxisStyle = {
    fontSize: '16px',
    fontFamily: 'Arial, sans-serif',
  };

  // Adjust plot height based on the number of arms.
  const plotHeightPx = Math.max(160, 64 * effectSizes.length);
  // Coarse adjustment of the width of the left Y-axis based on the length of the arm names.
  const maxArmNameLength = effectSizes.reduce((max, e) => Math.max(max, e.armName.length), 0);
  const yRightAxisWidthPx = 80;
  const yLeftAxisWidthPx = maxArmNameLength > 20 ? 180 : 80;

  return (
    <Flex direction="column" gap="3">
      <Flex direction="row" align="baseline" wrap="wrap">
        <Text weight="bold">Effect of {analysis.metric_name || 'Unknown Metric'}&nbsp;</Text>
        <MdeBadge value={mdePct} />
      </Flex>

      {effectSizes.some((e) => e.invalidStatTest) && (
        <Callout.Root color="orange" size="1">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>
            Statistical test is invalid for one or more arms. The experiment might not have enough data or no variation
            in the metric right now.
          </Callout.Text>
        </Callout.Root>
      )}

      <Box height={`${plotHeightPx}px`}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {/* Supply our own coordinates generator since default rendering is off for ratio metrics */}
            <CartesianGrid strokeDasharray="3 3" verticalCoordinatesGenerator={scaleXGridPoints} />
            <XAxis
              type="number"
              dataKey="absEffect"
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
              domain={effectSizes.map((e, i) => i)}
              // hide={true} - use ticks for arm names
              width={yLeftAxisWidthPx}
              style={commonAxisStyle}
              tickFormatter={(index) => {
                const name = index >= 0 && index < effectSizes.length ? effectSizes[index].armName : '';
                return truncateLabel(name);
              }}
              allowDataOverflow={true} // bit of a hack since the ErrorBar is internally messing with the y-axis domain
            />
            <YAxis
              yAxisId="stats"
              type="category"
              orientation="right"
              // work with an index into our different effect sizes
              domain={effectSizes.map((e, i) => i)}
              width={yRightAxisWidthPx}
              tick={(e) => {
                const {
                  payload: { value },
                } = e;
                const armData = effectSizes[value];

                let percentChangeText = '';
                if (!armData.isBaseline) {
                  const rawPercentChange =
                    ((armData.absEffect - armData.baselineEffect) / armData.baselineEffect) * 100;
                  // Handle cases where baselineEffect is 0 or very small to avoid Infinity or NaN
                  if (isFinite(rawPercentChange)) {
                    percentChangeText = `Δ = ${rawPercentChange.toFixed(1)}%`;
                  } else {
                    percentChangeText = 'change: N/A';
                  }
                }

                const pValueText = `p = ${armData.pValue !== null ? armData.pValue.toFixed(3) : 'N/A'}`;

                const commonRightAxisTextProps = {
                  x: e.x,
                  textAnchor: e.textAnchor,
                  // Only bold/black if significant AND not baseline arm
                  fill: armData.significant && !armData.isBaseline ? 'black' : undefined,
                  fontWeight: armData.significant && !armData.isBaseline ? 'bold' : undefined,
                };

                return (
                  <g>
                    <text
                      {...commonRightAxisTextProps}
                      style={commonAxisStyle}
                      y={e.y}
                      // dy shift here and below to align the two lines of text around the tick mark better
                      dy={!armData.isBaseline ? '-8px' : '0'}
                      dominantBaseline="middle"
                    >
                      {percentChangeText}
                    </text>
                    <text
                      {...commonRightAxisTextProps}
                      // Purposely smaller font size for the p-value
                      style={{ ...commonAxisStyle, fontSize: '12px' }}
                      y={e.y}
                      dy={!armData.isBaseline ? '8px' : '0'}
                      dominantBaseline="middle"
                    >
                      {pValueText}
                    </text>
                  </g>
                );
              }} // end tickFormatter, whew
              allowDataOverflow={true}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Confidence intervals - place under points */}
            <Scatter
              data={effectSizes}
              fill="none"
              // Draw a custom line for CIs since ErrorBars don't give us enough control
              shape={(props: CustomShapeProps) => {
                // Always return an element even if empty.
                if (!props.payload || !props.xAxis?.width) return <g />;

                const { ci95, significant, effect, isBaseline } = props.payload;
                const {
                  cx: centerX,
                  cy: centerY,
                  xAxis: { width: xAxisWidth },
                } = props;

                // Determine stroke color based on significance and direction
                let strokeColor: string = COLORS.DEFAULT_CI;
                if (significant && !isBaseline) {
                  strokeColor = effect > 0 ? COLORS.POSITIVE : COLORS.NEGATIVE;
                }
                return (
                  <line
                    x1={(centerX || 0) - scaleHalfIntervalToViewport(ci95, xAxisWidth)}
                    y1={centerY}
                    x2={(centerX || 0) + scaleHalfIntervalToViewport(ci95, xAxisWidth)}
                    y2={centerY}
                    stroke={strokeColor}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />
                );
              }}
            >
              {/* <ErrorBar dataKey="ci95" width={0} strokeWidth={10} stroke={"red"} opacity={0.2} direction="x"/> */}
            </Scatter>

            {/* All arms */}
            <Scatter
              data={effectSizes}
              shape={(props: CustomShapeProps) => {
                // Always return an element even if empty.
                if (!props.payload) return <g />;

                const { significant, isBaseline, effect } = props.payload;
                const { cx: centerX, cy: centerY } = props;

                let fillColor: string = COLORS.DEFAULT;
                if (significant && !isBaseline) {
                  fillColor = effect > 0 ? COLORS.POSITIVE : COLORS.NEGATIVE;
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
                } else {
                  return <circle cx={centerX} cy={centerY} r={5} fill={fillColor} stroke={COLORS.DEFAULT_CI} />;
                }
              }}
            />

            {/* Control arm mean - vertical marker */}
            <Scatter
              data={effectSizes}
              fill="none"
              // Draw a custom SVG line for CIs since ErrorBars don't give us enough control
              shape={(props: CustomShapeProps) => {
                // Always return an element even if empty.
                if (!props.payload?.isBaseline) return <g />;

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
}
