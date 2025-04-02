'use client';
import { ExperimentAnalysis, ExperimentConfig } from '@/api/methods.schemas';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar } from 'recharts';

// Color constants
const COLORS = {
  DEFAULT: '#757575', // Gray for default/control
  BLACK: '#000000',   // Black for default stroke
  POSITIVE: '#00c853', // Green for positive effects
  NEGATIVE: '#ff5252', // Red for negative effects
} as const;

interface EffectSizeData {
  isControl: boolean;
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
  pValue: number;
  significant: boolean;
  sampleSize: number;
  totalSampleSize: number;
  controlSampleSize: number;
  controlTotalSampleSize: number;
}

interface ForestPlotProps {
  analysis: ExperimentAnalysis;
  armNames: Record<string, string>;
  controlArmIndex?: number;
  experiment: ExperimentConfig;
}

interface CustomShapeProps {  // inferred from inspecting props to the shape function; see also ScatterCustomizedShape recharts
  cx?: number;
  cy?: number;
  payload?: EffectSizeData;
  xAxis?: {
    width?: number;
  };
  yAxis?: {
    height?: number;
  };
}

// Function to create a diamond shape
const createDiamondShape = (cx: number = 0, cy: number = 0, size: number = 6) => {
  return `${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`;
};

function CustomTooltip({ active, payload }: { active: boolean, payload: [{ payload: EffectSizeData }] }) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  const percentChange = ((data.absEffect - data.baselineEffect) / data.baselineEffect * 100).toFixed(1);
  return (
    <Card style={{ padding: '8px' }}>
      <Flex direction="column" gap="2">
        <Text weight="bold">{data.armName}</Text>
        <Text>Effect: {data.absEffect.toFixed(2)}</Text>
        {data.isControl ? null : <Text>vs baseline: {percentChange}%</Text>}
        <Text>95% CI: [{data.absCI95Lower.toFixed(2)}, {data.absCI95Upper.toFixed(2)}]</Text>
      </Flex>
    </Card>
  );
}

// TODO(linus): currently the controlArmIndex is hardcoded to 0; payload also seems to have the wrong mapping of arm_ids to coefficients.
export function ForestPlot({ analysis, armNames, controlArmIndex = 0, experiment }: ForestPlotProps) {
  // Get all arm indices except the control arm
  // const treatmentArmIndices = analysis.arm_ids.map((_, idx) => idx).filter((idx) => idx !== controlArmIndex);
  const treatmentArmIndices = analysis.arm_ids.map((_, idx) => idx);

  // Get total sample size from assign summary
  const availableN = experiment.assign_summary.sample_size;

  // Extract data for visualization
  const controlArmId = analysis.arm_ids[controlArmIndex];
  const controlArmSize = experiment.assign_summary.arm_sizes?.find(a => a.arm.arm_id === controlArmId)?.size || 0;

  // Our data structure for Recharts
  const effectSizes: EffectSizeData[] = treatmentArmIndices.map((treatmentIdx, index) => {
    const controlCoefficient = analysis.coefficients[controlArmIndex];
    const coefficient = analysis.coefficients[treatmentIdx];
    const stdError = analysis.std_errors[treatmentIdx];
    const pValue = analysis.pvalues[treatmentIdx];


    const isControl = treatmentIdx === controlArmIndex;
    const armId = analysis.arm_ids[treatmentIdx];
    const armSize = experiment.assign_summary.arm_sizes?.find(a => a.arm.arm_id === armId)?.size || 0;
    // Calculate 95% confidence interval
    const ci95 = 1.96 * stdError;
    const ci95Lower = coefficient - ci95;
    const ci95Upper = coefficient + ci95;
    const absEffect = coefficient  + (isControl ? 0 : controlCoefficient);
    const absCI95Lower = ci95Lower + (isControl ? 0 : controlCoefficient);
    const absCI95Upper = ci95Upper + (isControl ? 0 : controlCoefficient);

    return {
      isControl,
      armId,
      armName: armNames[armId] || `Arm ${treatmentIdx}`,
      baselineEffect: controlCoefficient,
      effect: coefficient, // relative to baseline effect
      absEffect: absEffect,
      ci95Lower,
      ci95Upper,
      ci95: ci95, // for symmetric ErrorBars
      absCI95Lower,
      absCI95Upper,
      pValue,
      significant: pValue < (experiment.design_spec.alpha || 0.05),
      sampleSize: armSize,
      totalSampleSize: availableN,
      controlSampleSize: controlArmSize,
      controlTotalSampleSize: availableN,
    };
  });

  // Only render if we have data
  if (effectSizes.length === 0) {
    return <Text>No treatment arms to display</Text>;
  }

  // Get the min and max x-axis values to use in our charts.
  function getMinMaxX(effectSizes: EffectSizeData[]) {
    let minX = Math.min(...effectSizes.map(d => d.absCI95Lower));
    let maxX = Math.max(...effectSizes.map(d => d.absCI95Upper));
    const viewportWidth = maxX - minX;
    minX = minX - viewportWidth*.05;
    maxX = maxX + viewportWidth*.05;
    if (Math.abs(minX) > 1 && Math.abs(maxX) > 1) {
      minX = Math.floor(minX);
      maxX = Math.ceil(maxX);
    }
    return [minX, maxX];
  }
  const [minX, maxX] = getMinMaxX(effectSizes);
  // Scale a half-confidence interval to a width in viewport units to be used for drawing the error bars
  const scaleHalfIntervalToViewport = (x: number, width: number|undefined) => {
    if (!width) return 0;
    return (x / (maxX - minX)) * width;
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Text weight="bold">Effect of {analysis.metric_name}</Text>

        <Box style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="absEffect"
                domain={[minX, maxX]}
                tickFormatter={(value) => value >= 1 ? value.toFixed() : value.toFixed(2)}
              />
              <YAxis
                type="category"
                domain={effectSizes.map((e,i) => i)}
                // hide={true} - use ticks for arm names
                tickFormatter={(index) => {
                  return index >= 0 && index < effectSizes.length ? effectSizes[index].armName : '';
                }}
                allowDataOverflow={true}  // bit of a hack since the ErrorBar is internally messing with the y-axis domain
              />
              <YAxis
                yAxisId="stats"
                type="category"
                orientation="right"
                // work with an index into our different effect sizes
                domain={effectSizes.map((e, i) => i)}
                width={80}
                tick={(e) => {
                  const { payload: { value } } = e;
                  const textProps = {
                    x: e.x,
                    y: e.y,
                    textAnchor: e.textAnchor,
                    fill: effectSizes[value].significant ? "black" : undefined,
                    fontWeight: effectSizes[value].significant ? "bold" : undefined,
                    dominantBaseline: "middle" as const
                  };
                  const tickLabel = `p = ${effectSizes[value].pValue.toFixed(3)}`;
                  return <text {...textProps}>{tickLabel}</text>;
                }}
                allowDataOverflow={true}
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              {/* Confidence intervals - place under points */}
              <Scatter
                data={effectSizes}
                fill="none"
                // Draw a custom line for CIs since ErrorBars don't give us enough control
                shape={(props: CustomShapeProps) => {
                  if (!props.payload || !props.xAxis?.width) return null;
                  const { ci95, significant, effect, isControl } = props.payload;

                  // Determine stroke color based on significance and direction
                  let strokeColor = COLORS.BLACK; // Default
                  if (significant && !isControl) {
                    strokeColor = effect > 0 ? COLORS.POSITIVE : COLORS.NEGATIVE;
                  }
                  return (
                    <line
                      x1={props.cx - scaleHalfIntervalToViewport(ci95, props.xAxis?.width)}
                      y1={props.cy}
                      x2={props.cx + scaleHalfIntervalToViewport(ci95, props.xAxis?.width)}
                      y2={props.cy}
                      stroke={strokeColor}
                      strokeWidth={2}
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
                  if (!props.payload) return null;
                  const { significant, isControl, effect } = props.payload;
                  let fillColor: string = COLORS.DEFAULT; // Default gray
                  if (significant && !isControl) {
                    fillColor = effect > 0 ? COLORS.POSITIVE : COLORS.NEGATIVE;
                  }
                  if (props.payload?.isControl) {
                    // Mark the control arm with a larger diamond shape
                    return <polygon
                      points={createDiamondShape(props.cx, props.cy, 8)}
                      fill={COLORS.DEFAULT}
                      stroke="none"
                    />
                  } else {
                    return <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={fillColor}
                      stroke="none"
                    />
                  }
                }}
              />

              {/* Control arm mean - vertical marker */}
              <Scatter
                data={effectSizes}
                fill="none"
                // Draw a custom SVG line for CIs since ErrorBars don't give us enough control
                shape={(props: CustomShapeProps) => {
                  if (!props.payload) return null;
                  const { isControl } = props.payload;
                  if (!isControl) return null;
                  return (
                    <line
                      x1={props.cx}
                      y1={0}
                      x2={props.cx}
                      y2={props.yAxis?.height + 20}  // where's the extra 20 from?
                      stroke="red"
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
    </Card>
  );
}
