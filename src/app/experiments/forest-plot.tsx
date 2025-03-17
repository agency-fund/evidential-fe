'use client';
import { ExperimentAnalysis, ExperimentConfig } from '@/api/methods.schemas';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';

/**
 * Represents the calculated effect size data for a treatment arm
 */
// TODO(roboton): These are all suspicious.
interface EffectSizeData {
  /** Unique identifier for the arm */
  armId: string;
  /** Display name for the arm */
  armName: string;
  /** Effect size as a percentage (coefficient * 100) */
  effect: number;
  /** Lower bound of 95% confidence interval as a percentage */
  ci95Lower: number;
  /** Upper bound of 95% confidence interval as a percentage */
  ci95Upper: number;
  /** P-value for statistical significance */
  pValue: number;
  /** Probability that the treatment is better than control (as a percentage) */
  winProbability: number;
  /** Whether the effect is statistically significant (p < 0.05) */
  significant: boolean;
  /** Conversion rate for this arm (if available) */
  conversionRate?: number;
  /** Sample size for this arm (if available) */
  sampleSize?: number;
  /** Total sample size for this arm (if available) */
  totalSampleSize?: number;
  /** Conversion rate for the control arm (if available) */
  controlConversionRate?: number;
  /** Sample size for the control arm (if available) */
  controlSampleSize?: number;
  /** Total sample size for the control arm (if available) */
  controlTotalSampleSize?: number;
}

interface ForestPlotProps {
  analysis: ExperimentAnalysis;
  armNames: Record<string, string>;
  /**
   * Index of the control arm in the analysis.arm_ids array.
   * Defaults to 0 (first arm) if not specified.
   */
  controlArmIndex?: number;
  /**
   * Sample sizes for each arm, keyed by arm ID
   * If provided, will display conversion rates
   */
  sampleSizes?: Record<string, { conversions: number; total: number }>;
  /**
   * The experiment configuration containing design parameters
   */
  experiment: ExperimentConfig;
}

export function ForestPlot({ analysis, armNames, controlArmIndex = 0, sampleSizes, experiment }: ForestPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  // Responsive width adjustment
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setWidth(entry.contentRect.width);
        }
      });

      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Get all arm indices except the control arm
  const treatmentArmIndices = analysis.arm_ids.map((_, idx) => idx).filter((idx) => idx !== controlArmIndex);

  // Extract data for visualization
  const effectSizes: EffectSizeData[] = treatmentArmIndices.map((treatmentIdx) => {
    const coefficient = analysis.coefficients[treatmentIdx];
    const stdError = analysis.std_errors[treatmentIdx];
    const pValue = analysis.pvalues[treatmentIdx];

    // Calculate 95% confidence interval
    const ci95Lower = coefficient - 1.96 * stdError;
    const ci95Upper = coefficient + 1.96 * stdError;

    // Calculate win probability (simplified)
    const zScore = coefficient / stdError;
    const winProbability = 1 - (1 - normCDF(zScore)) * 2;

    const armId = analysis.arm_ids[treatmentIdx];
    const sampleData = sampleSizes?.[armId];
    const controlSampleData = sampleSizes?.[analysis.arm_ids[controlArmIndex]];

    return {
      armId,
      armName: armNames[armId] || `Arm ${treatmentIdx}`,
      effect: coefficient * 100, // Convert to percentage
      ci95Lower: ci95Lower * 100,
      ci95Upper: ci95Upper * 100,
      pValue,
      winProbability: winProbability * 100,
      significant: pValue < (experiment.design_spec.alpha || 0.05),
      conversionRate: sampleData ? (sampleData.conversions / sampleData.total) * 100 : undefined,
      sampleSize: sampleData?.conversions,
      totalSampleSize: sampleData?.total,
      controlConversionRate: controlSampleData
        ? (controlSampleData.conversions / controlSampleData.total) * 100
        : undefined,
      controlSampleSize: controlSampleData?.conversions,
      controlTotalSampleSize: controlSampleData?.total,
    };
  });

  // Visualization parameters
  const padding = { top: 20, right: 20, bottom: 20, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = 80;

  // Calculate scale for x-axis
  const allValues = effectSizes.flatMap((d) => [d.effect, d.ci95Lower, d.ci95Upper]);
  const minValue = Math.min(...allValues, -30);
  const maxValue = Math.max(...allValues, 30);
  const range = Math.max(Math.abs(minValue), Math.abs(maxValue));

  // Scale function to convert data value to pixel position
  const scaleX = (value: number) => {
    return padding.left + ((value + range) / (range * 2)) * plotWidth;
  };

  // Only render if we have data
  if (effectSizes.length === 0) {
    return <Text>No treatment arms to display</Text>;
  }

  return (
    <Card ref={containerRef}>
      <Flex direction="column" gap="3">
        <Text weight="bold">Effect of {analysis.metric_name}</Text>

        <Flex justify="between" align="center">
          {/* Left side - Control metrics */}
          <Flex direction="column" gap="1" style={{ width: '25%' }}>
            {effectSizes[0].controlConversionRate !== undefined && (
              <Text size="3" weight="bold">
                {effectSizes[0].controlConversionRate.toFixed(2)}%
              </Text>
            )}
            {effectSizes[0].controlSampleSize !== undefined && effectSizes[0].controlTotalSampleSize !== undefined && (
              <Text size="2" color="gray">
                {effectSizes[0].controlSampleSize.toLocaleString()} /{' '}
                {effectSizes[0].controlTotalSampleSize.toLocaleString()}
              </Text>
            )}
          </Flex>

          {/* Middle - Treatment metrics */}
          <Flex direction="column" gap="1" style={{ width: '25%' }}>
            {effectSizes[0].conversionRate !== undefined && (
              <Text size="3" weight="bold">
                {effectSizes[0].conversionRate.toFixed(2)}%
              </Text>
            )}
            {effectSizes[0].sampleSize !== undefined && effectSizes[0].totalSampleSize !== undefined && (
              <Text size="2" color="gray">
                {effectSizes[0].sampleSize.toLocaleString()} / {effectSizes[0].totalSampleSize.toLocaleString()}
              </Text>
            )}
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

        <Box style={{ position: 'relative', height: plotHeight, backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          {/* Zero line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: scaleX(0),
              width: '1px',
              backgroundColor: '#ccc',
            }}
          />

          {/* X-axis labels */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, textAlign: 'center' }}>
            <Flex justify="between" px="4">
              <Text size="1">{-range.toFixed(0)}%</Text>
              <Text size="1">0%</Text>
              <Text size="1">{range.toFixed(0)}%</Text>
            </Flex>
          </div>

          {/* Effect size and confidence interval */}
          {effectSizes.map((effect) => (
            <div key={effect.armId} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}>
              {/* Confidence interval line */}
              <div
                style={{
                  position: 'absolute',
                  height: '2px',
                  backgroundColor: '#e0e0e0',
                  left: scaleX(effect.ci95Lower),
                  width: scaleX(effect.ci95Upper) - scaleX(effect.ci95Lower),
                }}
              />

              {/* Effect size point */}
              <div
                style={{
                  position: 'absolute',
                  height: '16px',
                  width: '8px',
                  backgroundColor: effect.significant ? '#00c853' : '#757575',
                  left: scaleX(effect.effect) - 4,
                  top: '-8px',
                  borderRadius: '2px',
                }}
              />
            </div>
          ))}
        </Box>
      </Flex>
    </Card>
  );
}

// Standard normal cumulative distribution function
function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) {
    p = 1 - p;
  }
  return p;
}
