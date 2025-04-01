'use client';
import { ExperimentAnalysis, ExperimentConfig } from '@/api/methods.schemas';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterProps, ErrorBar } from 'recharts';

interface EffectSizeData {
  isControl: boolean;
  armId: string;
  armName: string;
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

// TODO(linus): currently the controlArmIndex is hardcoded to 0; payload also seems to have the wrong mapping of arm_ids to coefficients.
export function ForestPlot({ analysis, armNames, controlArmIndex = 0, experiment }: ForestPlotProps) {
  // Get all arm indices except the control arm
  // const treatmentArmIndices = analysis.arm_ids.map((_, idx) => idx).filter((idx) => idx !== controlArmIndex);
  const treatmentArmIndices = analysis.arm_ids.map((_, idx) => idx);

  // Get total sample size from assign summary
  const availableN = experiment.assign_summary.sample_size;

  // Extract data for visualization
  const controlCoefficient = analysis.coefficients[controlArmIndex];
  const controlArmId = analysis.arm_ids[controlArmIndex];
  const controlArmSize = experiment.assign_summary.arm_sizes?.find(a => a.arm.arm_id === controlArmId)?.size || 0;

  const effectSizes: EffectSizeData[] = treatmentArmIndices.map((treatmentIdx) => {
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

  // Create data for Recharts
  const chartData = effectSizes.map((effect, index) => ({
    ...effect,
    y: 1 + index, // Position each treatment on its own line
  }));

  // Add control arm data
  // const controlData = [{
  //   armId: analysis.arm_ids[controlArmIndex],
  //   armName: armNames[analysis.arm_ids[controlArmIndex]] || 'Control',
  //   effect: analysis.coefficients[controlArmIndex],
  //   ci95Lower: 0,
  //   ci95Upper: 0,
  //   pValue: 1,
  //   significant: false,
  //   y: effectSizes.length + 1, // Position control at the top
  // }];

  // Only render if we have data
  if (effectSizes.length === 0) {
    return <Text>No treatment arms to display</Text>;
  }

  // Define scale function for positioning elements
  let minX = Math.min(...chartData.map(d => d.absCI95Lower));
  let maxX = Math.max(...chartData.map(d => d.absCI95Upper));
  const viewportWidth = maxX - minX;
  minX = minX - viewportWidth*.05;
  maxX = maxX + viewportWidth*.05;
  if (Math.abs(minX) > 1 && Math.abs(maxX) > 1) {
    minX = Math.floor(minX);
    maxX = Math.ceil(maxX);
  }
  // Scale a half-confidence interval to a width in viewport units to be used for drawing the error bars
  const scale = (x: number, width: number|undefined) => {
    if (!width) return 0;
    return (x / (maxX - minX)) * width;
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Text weight="bold">Effect of {analysis.metric_name}</Text>

        <Flex justify="between" align="center">
          {/* Left side - Control metrics */}
          <Flex direction="column" gap="1" style={{ width: '25%' }}>
            <Text size="2" color="gray">
              {effectSizes[0].controlSampleSize?.toLocaleString()} / {effectSizes[0].controlTotalSampleSize?.toLocaleString()}
            </Text>
          </Flex>

          {/* Middle - Treatment metrics */}
          <Flex direction="column" gap="1" style={{ width: '25%' }}>
            <Text size="2" color="gray">
              {effectSizes[0].sampleSize?.toLocaleString()} / {effectSizes[0].totalSampleSize?.toLocaleString()}
            </Text>
          </Flex>

          {/* Right side - P-value */}
          <Flex direction="column" gap="1" style={{ width: '25%', textAlign: 'right' }}>
            <Text size="2" weight="bold">
              p = {effectSizes[0].pValue.toFixed(3)}
            </Text>
            <Text size="2" weight="bold">
              {effectSizes[0].significant ? 'Significant' : 'Not Significant'}
            </Text>
          </Flex>
        </Flex>

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
                dataKey="y"
                domain={[0, chartData.length + 1]}
                // hide={true}
                tickFormatter={(value) => {
                  const index = parseInt(value) - 1;
                  return index >= 0 && index < effectSizes.length ? effectSizes[index].armName : '';
                }}
                allowDataOverflow={true}  // bit of a hack since the ErrorBar is internally messing with the y-axis domain
              />

              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'absEffect') return value.toFixed(2);
                  return effectSizes[value-1]?.armName;
                }}
              />

              {/* Control arm baseline */}
              {/* <Scatter
                data={controlData}
                fill="#757575"
                shape={(props: CustomShapeProps) => (
                  <polygon
                    points={createDiamondShape(props.cx, props.cy, 8)}
                    fill="#757575"
                    stroke="none"
                  />
                )}
              /> */}

              {/* Treatment arms */}
              <Scatter
                data={chartData}
                fill="#8884d8"
                shape={(props: CustomShapeProps) => {
                  if (props.payload?.isControl) {
                    // Mark the control arm with a larger diamond shape
                    return <polygon
                      points={createDiamondShape(props.cx, props.cy, 8)}
                      fill="#757575"
                      stroke="none"
                    />
                  } else {
                    return <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={props.payload?.significant ? '#00c853' : '#757575'}
                      stroke="none"
                    />
                  }
                }}
              />

              {/* Confidence intervals */}
              <Scatter
                data={chartData}
                fill="none"
                // Draw a custom line for CIs since ErrorBars don't give us enough control
                shape={(props: CustomShapeProps) => {
                  if (!props.payload || !props.xAxis?.width) return null;
                  const { ci95, significant, effect, isControl } = props.payload;

                  // Determine stroke color based on significance and direction
                  let strokeColor = "#000000"; // Default black
                  if (significant && !isControl) {
                    strokeColor = effect > 0 ? "#00c853" : "#ff5252"; // Green if positive, red if negative
                  }
                  return (
                    <line
                      x1={props.cx - scale(ci95, props.xAxis?.width)}
                      y1={props.cy}
                      x2={props.cx + scale(ci95, props.xAxis?.width)}
                      y2={props.cy}
                      stroke={strokeColor}
                      strokeWidth={2}
                    />
                  );
                }}
              >
                {/* <ErrorBar dataKey="ci95" width={0} strokeWidth={10} stroke={"red"} opacity={0.2} direction="x"/> */}
              </Scatter>


              {/* Vertical line through control point
                  TODO(linus): This is broken.*/}
              <line
                x1={`${((0 - minX) / (maxX - minX)) * 100}%`}
                y1={0}
                x2={`${((0 - minX) / (maxX - minX)) * 100}%`}
                y2={effectSizes.length + 2}
                stroke="#757575"
                strokeDasharray="5 5"
                strokeWidth={1}
              />
              <Scatter
                data={chartData}
                fill="none"
                // Draw a custom line for CIs since ErrorBars don't give us enough control
                shape={(props: CustomShapeProps) => {
                  if (!props.payload) return null;
                  const { isControl } = props.payload;
                  if (!isControl) return null;
                  return (
                    <line
                      x1={props.cx}
                      y1={0}
                      x2={props.cx}
                      y2={props.yAxis?.height + 20}
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
