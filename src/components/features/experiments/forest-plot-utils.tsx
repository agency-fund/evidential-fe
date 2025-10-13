import { MetricAnalysis, ExperimentAnalysisResponse, FreqExperimentAnalysisResponse } from '@/api/methods.schemas';

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
}

export interface AnalysisState {
  key: string;
  data: ExperimentAnalysisResponse | undefined;
  updated_at: Date;
  label: string;
  effectSizesByMetric?: Map<string, EffectSizeData[]>;
}

/**
 * Type guard to check if an analysis response is a frequentist experiment.
 *
 * @param analysisData - The experiment analysis response to check
 * @returns True if the analysis is for a frequentist experiment
 */
export function isFrequentist(
  analysisData: ExperimentAnalysisResponse | undefined,
): analysisData is FreqExperimentAnalysisResponse {
  return analysisData?.type === 'freq';
}

/**
 * Pre-computes effect size data for all metrics in a frequentist analysis.
 * Returns undefined for non-frequentist experiments.
 *
 * @param analysisData - The experiment analysis response
 * @param alpha - The significance threshold (e.g., 0.05 for 95% confidence)
 * @returns Map of metric names to effect size arrays, or undefined
 */
export function precomputeEffectSizesByMetric(
  analysisData: ExperimentAnalysisResponse,
  alpha: number = 0.05,
): Map<string, EffectSizeData[]> | undefined {
  if (!isFrequentist(analysisData)) return undefined;

  const effectSizesByMetric = new Map<string, EffectSizeData[]>();
  for (const metricAnalysis of analysisData.metric_analyses) {
    // TODO: cleanup fallback when metric_name is not nullable in the backend (wasn't supposed to be)
    const metricName = metricAnalysis.metric_name || '';
    const effectSizes = generateEffectSizeData(metricAnalysis, alpha);
    effectSizesByMetric.set(metricName, effectSizes);
  }
  return effectSizesByMetric;
}

/**
 * Computes min/max CI bounds for a given metric from a subset of analysis states.
 * This is useful for creating stable plot axes.
 *
 * @param metricName - The metric field name to compute bounds for
 * @param analysisStates - Array of analysis states (e.g., snapshots and live analysis)
 * @param numSnapshots - Number of most recent analyses to include (default: 8)
 * @returns Tuple of [minLower, maxUpper] or [undefined, undefined] if no data
 */
export function computeBoundsForMetric(
  metricName: string | undefined,
  analysisStates: AnalysisState[],
  numSnapshots: number = 8,
): [number | undefined, number | undefined] {
  if (!metricName) {
    return [undefined, undefined];
  }

  let minLower: number | undefined = undefined;
  let maxUpper: number | undefined = undefined;

  // Include up to numSnapshots most recent analyses
  const analysesToCheck = analysisStates.slice(0, numSnapshots);

  // Iterate through all analyses and find min/max
  for (const analysis of analysesToCheck) {
    const effectSizes = analysis.effectSizesByMetric?.get(metricName);
    if (!effectSizes) continue;

    for (const effectSize of effectSizes) {
      const { absCI95Lower, absCI95Upper } = effectSize;
      minLower = minLower === undefined ? absCI95Lower : Math.min(minLower, absCI95Lower);
      maxUpper = maxUpper === undefined ? absCI95Upper : Math.max(maxUpper, absCI95Upper);
    }
  }

  return [minLower, maxUpper];
}

/**
 * Generates effect size data for our forest plot visualization from a metric analysis.
 *
 * @param analysis - The metric analysis containing arm-level analyses
 * @param alpha - The significance threshold (e.g., 0.05 for 95% confidence)
 * @returns Array of effect size data for each arm
 */
export function generateEffectSizeData(analysis: MetricAnalysis, alpha: number): EffectSizeData[] {
  // Extract data for visualization
  const controlArmIndex = analysis.arm_analyses.findIndex((a) => a.is_baseline);
  const controlArmAnalysis = analysis.arm_analyses[controlArmIndex];
  const controlEstimate = controlArmAnalysis.estimate; // regression intercept

  // Our data structure for visualization
  const effectSizes: EffectSizeData[] = analysis.arm_analyses.map((armAnalysis, index) => {
    const isBaseline = armAnalysis.is_baseline;
    const armId = armAnalysis.arm_id || 'MISSING_ARM_ID'; // should be impossible

    const estimate = armAnalysis.estimate; // regression coefficient
    const stdError = armAnalysis.std_error;
    const pValue = armAnalysis.p_value;
    const tStat = armAnalysis.t_stat;
    const invalidStatTest = pValue === null || pValue === undefined || tStat === null || tStat === undefined;

    // Calculate 95% confidence interval
    // TODO: backend should return CIs; this approximation is for z-tests, and not appropriate for small sample sizes.
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
    };
  });

  return effectSizes;
}
