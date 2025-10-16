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

/**
 * Computes axis bounds (min/max) from an array of numeric values with padding and rounding.
 * This is used to create stable, nicely-formatted chart axes.
 *
 * @param values - Array of numeric values to compute bounds for
 * @param minProp - Optional minimum bound hint to enforce
 * @param maxProp - Optional maximum bound to enforce
 * @param padding - Fraction of range to add as padding (default: 0.1 for 10%)
 * @returns Tuple of [min, max] bounds
 */
export function computeAxisBounds(
  values: number[],
  minProp?: number,
  maxProp?: number,
  padding: number = 0.1,
): [number, number] {
  if (values.length === 0) {
    return [0, 1];
  }

  let min = Math.min(...values);
  let max = Math.max(...values);

  // Apply provided bounds hints if available
  if (minProp !== undefined) min = Math.min(min, minProp);
  if (maxProp !== undefined) max = Math.max(max, maxProp);

  // Add padding so points to render on the edges of your domain
  const range = max - min;
  min = min - range * padding;
  max = max + range * padding;

  // Round to nice numbers if values are large
  if (Math.abs(min) > 1 && Math.abs(max) > 1) {
    min = Math.floor(min);
    max = Math.ceil(max);
  }

  // If the domain appears to be essentially a singular value, make it larger to avoid a 0-width.
  if (Math.abs(max - min) < 0.0000001) {
    min = min - 1;
    max = max + 1;
  }

  return [min, max];
}

/**
 * Data structures for timeseries visualization
 */
export interface ArmDataPoint {
  estimate: number;
  upper: number;
  lower: number;
}

export interface TimeSeriesDataPoint {
  date: string; // YYYY-MM-DD format
  dateObj: Date; // For sorting/reference
  armEffects: Map<string, ArmDataPoint>; // armId => ArmDataPoint
}

export interface ArmMetadata {
  id: string;
  name: string;
  isBaseline: boolean;
}

/**
 * Helper function to calculate x-axis jitter offset
 */
export const calculateJitterOffset = (armIndex: number, totalArms: number): number => {
  const jitterSpacing = 6; // pixels between each arm's position
  const totalWidth = (totalArms - 1) * jitterSpacing;
  return armIndex * jitterSpacing - totalWidth / 2;
};

/**
 * Ease-out cubic function for smooth animation
 */
export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

/**
 * Transforms analysis states into chart data suitable for timeseries visualization.
 * Processes multiple analysis snapshots and converts them into a format ready for Recharts.
 *
 * @param analysisStates - Array of analysis states (e.g., snapshots and live analysis)
 * @param metricName - The metric field name to extract effect sizes for
 * @returns Object containing chartData and armMetadata for rendering
 */
export function transformAnalysisForForestTimeseriesPlot(
  analysisStates: AnalysisState[],
  metricName: string,
): {
  timeseriesData: TimeSeriesDataPoint[];
  armMetadata: ArmMetadata[];
} {
  const timeseriesData: TimeSeriesDataPoint[] = [];

  // Sort by date ascending (oldest to newest)
  const sortedStates = [...analysisStates].sort((a, b) => a.updated_at.getTime() - b.updated_at.getTime());

  // Filter out states that don't have effect sizes for this metric
  const validStates = sortedStates.filter((state) => state.effectSizesByMetric?.has(metricName));

  if (validStates.length === 0) {
    return { timeseriesData: [], armMetadata: [] };
  }

  // Extract arm metadata from the first valid data point
  const armMetadata: ArmMetadata[] = [];
  const firstEffectSizes = validStates[0].effectSizesByMetric?.get(metricName);
  if (firstEffectSizes) {
    for (const e of firstEffectSizes) {
      armMetadata.push({
        id: e.armId,
        name: e.armName,
        isBaseline: e.isBaseline,
      });
    }
  }

  // Transform each state into a timeseries data point
  for (const state of validStates) {
    const effectSizes = state.effectSizesByMetric?.get(metricName);
    if (!effectSizes) continue;

    const dateStr = state.updated_at.toISOString().split('T')[0]; // YYYY-MM-DD format
    const armEffects = new Map<string, ArmDataPoint>();

    for (const effectSize of effectSizes) {
      armEffects.set(effectSize.armId, {
        estimate: effectSize.absEffect,
        upper: effectSize.absCI95Upper,
        lower: effectSize.absCI95Lower,
      });
    }

    timeseriesData.push({
      date: dateStr,
      dateObj: state.updated_at,
      armEffects: armEffects,
    });
  }

  return {
    timeseriesData,
    armMetadata,
  };
}
