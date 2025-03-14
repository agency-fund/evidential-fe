'use client';
import { ExperimentAnalysis } from '@/api/methods.schemas';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { useEffect, useRef, useState } from 'react';

/**
 * Represents the calculated effect size data for a treatment arm
 */
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
}

interface ForestPlotProps {
  analysis: ExperimentAnalysis;
  armNames: Record<string, string>;
  /**
   * Index of the control arm in the analysis.arm_ids array.
   * Defaults to 0 (first arm) if not specified.
   */
  controlArmIndex?: number;
}

export function ForestPlot({ analysis, armNames, controlArmIndex = 0 }: ForestPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  
  // Responsive width adjustment
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setWidth(entry.contentRect.width);
        }
      });
      
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Get all arm indices except the control arm
  const treatmentArmIndices = analysis.arm_ids
    .map((_, idx) => idx)
    .filter(idx => idx !== controlArmIndex);

  // Extract data for visualization
  const effectSizes: EffectSizeData[] = treatmentArmIndices.map(treatmentIdx => {
    const coefficient = analysis.coefficients[treatmentIdx];
    const stdError = analysis.std_errors[treatmentIdx];
    const pValue = analysis.pvalues[treatmentIdx];
    
    // Calculate 95% confidence interval
    const ci95Lower = coefficient - 1.96 * stdError;
    const ci95Upper = coefficient + 1.96 * stdError;
    
    // Calculate win probability (simplified)
    const zScore = coefficient / stdError;
    const winProbability = 1 - (1 - normCDF(zScore)) * 2;
    
    return {
      armId: analysis.arm_ids[treatmentIdx],
      armName: armNames[analysis.arm_ids[treatmentIdx]] || `Arm ${treatmentIdx}`,
      effect: coefficient * 100, // Convert to percentage
      ci95Lower: ci95Lower * 100,
      ci95Upper: ci95Upper * 100,
      pValue,
      winProbability: winProbability * 100,
      significant: pValue < 0.05
    };
  });

  // Visualization parameters
  const padding = { top: 20, right: 20, bottom: 20, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = 80;
  
  // Calculate scale for x-axis
  const allValues = effectSizes.flatMap(d => [d.effect, d.ci95Lower, d.ci95Upper]);
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
        
        <Box style={{ position: 'relative', height: plotHeight }}>
          {/* Zero line */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: scaleX(0),
              width: '1px',
              backgroundColor: '#ccc'
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
                  width: scaleX(effect.ci95Upper) - scaleX(effect.ci95Lower)
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
                  borderRadius: '2px'
                }}
              />
            </div>
          ))}
        </Box>
        
        {/* Statistics display */}
        <Flex justify="between" align="center">
          <Flex direction="column" gap="1">
            <Text size="1" weight="bold">Control</Text>
            <Text size="1">
              {(analysis.coefficients[controlArmIndex] * 100).toFixed(2)}%
            </Text>
          </Flex>
          
          <Flex direction="column" gap="1">
            <Text size="1" weight="bold">{effectSizes[0].armName}</Text>
            <Text size="1">
              {effectSizes[0].effect.toFixed(2)}%
            </Text>
          </Flex>
          
          <Flex direction="column" gap="1">
            <Text size="1" weight="bold">Win probability</Text>
            <Text size="1" color={effectSizes[0].significant ? "green" : "gray"}>
              {effectSizes[0].winProbability.toFixed(1)}%
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}

// Standard normal cumulative distribution function
function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) {
    p = 1 - p;
  }
  return p;
}
