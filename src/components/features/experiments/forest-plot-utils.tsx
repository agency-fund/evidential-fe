import { MetricAnalysis } from '@/api/methods.schemas';

export interface EffectSizeData {
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

/**
 * Generates effect size data for our forest plot visualization from a metric analysis.
 *
 * @param analysis - The metric analysis containing arm-level analyses
 * @param alpha - The significance threshold (e.g., 0.05 for 95% confidence)
 * @param totalSampleSize - The total sample size across all arms
 * @param armSizes - Map of arm IDs to their sample sizes
 * @returns Array of effect size data for each arm
 */
export function generateEffectSizeData(
  analysis: MetricAnalysis,
  alpha: number,
  totalSampleSize: number,
  armSizes: Map<string, number>,
): EffectSizeData[] {
  // Extract data for visualization
  const controlArmIndex = analysis.arm_analyses.findIndex((a) => a.is_baseline);
  const controlArmAnalysis = analysis.arm_analyses[controlArmIndex];
  const controlEstimate = controlArmAnalysis.estimate; // regression intercept

  // Our data structure for visualization
  const effectSizes: EffectSizeData[] = analysis.arm_analyses.map((armAnalysis, index) => {
    const isBaseline = armAnalysis.is_baseline;
    const armId = armAnalysis.arm_id || 'MISSING_ARM_ID'; // should be impossible
    const armSize = armSizes.get(armId) || 0;

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
      significant: !!(pValue && pValue < alpha),
      sampleSize: armSize,
      totalSampleSize,
    };
  });

  return effectSizes;
}
