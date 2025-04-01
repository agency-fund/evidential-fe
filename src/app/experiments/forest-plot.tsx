'use client';
import { ExperimentAnalysis, ExperimentConfig } from '@/api/methods.schemas';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterProps } from 'recharts';

interface EffectSizeData {
  armId: string;
  armName: string;
  effect: number;
  ci95Lower: number;
  ci95Upper: number;
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

interface CustomShapeProps {
  cx?: number;
  cy?: number;
  payload?: EffectSizeData;
  width?: number;
}

// Function to create a diamond shape
const createDiamondShape = (cx: number = 0, cy: number = 0, size: number = 6) => {
  return `${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`;
};

export function ForestPlot({ analysis, armNames, controlArmIndex = 0, experiment }: ForestPlotProps) {
  // Get all arm indices except the control arm
  const treatmentArmIndices = analysis.arm_ids.map((_, idx) => idx).filter((idx) => idx !== controlArmIndex);

  // Get total sample size from assign summary
  const availableN = experiment.assign_summary.sample_size;

  // Extract data for visualization
  const effectSizes: EffectSizeData[] = treatmentArmIndices.map((treatmentIdx) => {
    const coefficient = analysis.coefficients[treatmentIdx];
    const stdError = analysis.std_errors[treatmentIdx];
    const pValue = analysis.pvalues[treatmentIdx];

    // Calculate 95% confidence interval
    const ci95Lower = coefficient - 1.96 * stdError;
    const ci95Upper = coefficient + 1.96 * stdError;

    const armId = analysis.arm_ids[treatmentIdx];
    const armSize = experiment.assign_summary.arm_sizes.find(a => a.arm.arm_id === armId)?.size || 0;
    const controlArmId = analysis.arm_ids[controlArmIndex];
    const controlArmSize = experiment.assign_summary.arm_sizes.find(a => a.arm.arm_id === controlArmId)?.size || 0;

    return {
      armId,
      armName: armNames[armId] || `Arm ${treatmentIdx}`,
      effect: coefficient, // Use actual coefficient value
      ci95Lower,
      ci95Upper,
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
    y: effectSizes.length - index, // Position each treatment on its own line
  }));

  // Add control arm data
  const controlData = [{
    armId: analysis.arm_ids[controlArmIndex],
    armName: armNames[analysis.arm_ids[controlArmIndex]] || 'Control',
    effect: 0,
    ci95Lower: 0,
    ci95Upper: 0,
    pValue: 1,
    significant: false,
    y: effectSizes.length + 1, // Position control at the top
  }];

  // Only render if we have data
  if (effectSizes.length === 0) {
    return <Text>No treatment arms to display</Text>;
  }

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
                dataKey="effect"
                domain={[-30, 30]}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, effectSizes.length + 2]}
                hide
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'effect') return value.toFixed(2);
                  return value;
                }}
              />

              {/* Control arm baseline */}
              <Scatter
                data={controlData}
                fill="#757575"
                shape={(props: CustomShapeProps) => (
                  <polygon
                    points={createDiamondShape(props.cx, props.cy, 8)}
                    fill="#757575"
                    stroke="none"
                  />
                )}
              />

              {/* Treatment arms */}
              <Scatter
                data={chartData}
                fill="#8884d8"
                shape={(props: CustomShapeProps) => (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={4}
                    fill={props.payload?.significant ? '#00c853' : '#757575'}
                    stroke="none"
                  />
                )}
              />

              {/* Confidence intervals */}
              <Scatter
                data={chartData}
                fill="none"
                shape={(props: CustomShapeProps) => {
                  if (!props.payload || !props.width) return null;
                  const { ci95Lower, ci95Upper, significant, effect } = props.payload;
                  const scale = (x: number) => {
                    const min = -30;
                    const max = 30;
                    return ((x - min) / (max - min)) * props.width;
                  };

                  // Determine stroke color based on significance and direction
                  let strokeColor = "#000000"; // Default black
                  if (significant) {
                    strokeColor = effect > 0 ? "#00c853" : "#ff5252"; // Green if positive, red if negative
                  }

                  return (
                    <line
                      x1={scale(ci95Lower)}
                      y1={props.cy}
                      x2={scale(ci95Upper)}
                      y2={props.cy}
                      stroke={strokeColor}
                      strokeWidth={2}
                    />
                  );
                }}
              />

              {/* Vertical line through control point */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={effectSizes.length + 2}
                stroke="#757575"
                strokeDasharray="5 5"
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
    </Card>
  );
}
