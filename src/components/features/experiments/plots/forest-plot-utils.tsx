import {
  MetricAnalysis,
  ExperimentAnalysisResponse,
  FreqExperimentAnalysisResponse,
  BanditExperimentAnalysisResponse,
  GetExperimentResponse,
} from '@/api/methods.schemas';
import {
  BanditEffectData,
  EffectSizeData,
  AnalysisState,
  ArmDataPoint,
  TimeSeriesDataPoint,
  ArmMetadata,
  Significance,
} from './forest-plot-models';
import { formatDateUtcYYYYMMDD } from '@/services/date-utils';
import { isFrequentistSpec } from '@/app/datasources/[datasourceId]/experiments/create/types';

// Base Radix colors for use as color props.
// NOTE: keep in sync with ARM_COLORS used for plotting.
export const ARM_COLORS_FOR_TEXT = ['blue', 'iris', 'plum', 'brown', 'cyan', 'indigo', 'violet', 'purple'] as const;
// Aiming for reasonably visually distinct colors for different arm line plots.
// NOTE: keep in sync with ARM_COLORS_FOR_TEXT used with Text.
export const ARM_COLORS = [
  'var(--blue-10)',
  'var(--iris-10)',
  'var(--plum-10)',
  'var(--brown-10)',
  'var(--cyan-10)',
  'var(--indigo-10)',
  'var(--violet-10)',
  'var(--purple-10)',
] as const;
export const INACTIVE_ARM_COLORS = [
  'var(--blue-a5)',
  'var(--iris-a5)',
  'var(--plum-a5)',
  'var(--brown-a5)',
  'var(--cyan-a5)',
  'var(--indigo-a5)',
  'var(--violet-a5)',
  'var(--purple-a5)',
] as const;
export const BASELINE_INDICATOR_COLOR = 'var(--blue-a5)';
export const DEFAULT_POINT_COLOR = 'var(--gray-5)';
export const CONTROL_COLOR = 'var(--gray-10)';
export const INACTIVE_CONTROL_COLOR = 'var(--gray-a7)';
export const POSITIVE_COLOR = 'var(--jade-10)';
export const POSITIVE_LIGHT_COLOR = 'var(--jade-6)';
export const INACTIVE_POSITIVE_COLOR = 'var(--jade-a8)';
export const NEGATIVE_COLOR = 'var(--ruby-10)';
export const NEGATIVE_LIGHT_COLOR = 'var(--ruby-6)';
export const INACTIVE_NEGATIVE_COLOR = 'var(--ruby-a8)';

// Common axis style for Recharts plots using Radix Themes var with fallback.
export const COMMON_AXIS_STYLE = {
  fontSize: '16px',
  fontFamily: 'var(--default-font-family), sans-serif',
} as const;

/**
 * Type guard to check if an analysis response is a frequentist experiment.
 *
 * @param analysisData - The experiment analysis response to check
 * @returns True if the analysis is for a frequentist experiment
 */
export const isFrequentistAnalysis = (
  analysisData: ExperimentAnalysisResponse | undefined,
): analysisData is FreqExperimentAnalysisResponse => {
  return analysisData?.type === 'freq';
};

export const isBanditAnalysis = (
  analysisData: ExperimentAnalysisResponse | undefined,
): analysisData is BanditExperimentAnalysisResponse => {
  return analysisData?.type === 'bandit';
};

/**
 * Helper to safely extract alpha and power from frequentist experiment design specs
 *
 * @returns obj with alpha & power values from the exp design. Values are undefined if not a frequentist experiment.
 */
export const getAlphaAndPower = (
  experiment: GetExperimentResponse | undefined,
): { alpha: number | undefined; power: number | undefined } => {
  if (!isFrequentistSpec(experiment?.design_spec)) return { alpha: undefined, power: undefined };
  return {
    alpha: experiment?.design_spec?.alpha,
    power: experiment?.design_spec?.power,
  };
};

/**
 * Pre-computes effect size data for all metrics in a frequentist analysis.
 * Returns undefined for non-frequentist experiments (i.e. not FreqExperimentAnalysisResponse).
 *
 * @param analysisData - The experiment analysis response.
 * @param alpha - The significance threshold (e.g., 0.05 for 95% confidence)
 * @returns Map of metric names to effect size arrays, or undefined
 */
export const precomputeFreqEffectsByMetric = (
  analysisData: ExperimentAnalysisResponse,
  alpha: number = 0.05,
): Map<string, EffectSizeData[]> | undefined => {
  if (!isFrequentistAnalysis(analysisData)) return undefined;

  const effectSizesByMetric = new Map<string, EffectSizeData[]>();
  for (const metricAnalysis of analysisData.metric_analyses) {
    const effectSizes = _generateFreqEffectSizeData(metricAnalysis, alpha);
    effectSizesByMetric.set(metricAnalysis.metric_name, effectSizes);
  }
  return effectSizesByMetric;
};

/**
 * @returns undefined for non-bandit experiments (i.e. not BanditExperimentAnalysisResponse).
 */
export const precomputeBanditEffects = (analysisData: ExperimentAnalysisResponse): BanditEffectData[] | undefined => {
  if (!isBanditAnalysis(analysisData)) return undefined;
  return _generateBanditEffectData(analysisData);
};

/**
 * Computes min/max CI bounds for a given metric from a subset of analysis states. Bounds should
 * always be finite or undefined.  This is useful for creating stable plot axes.
 *
 * @param metricName - The metric field name to compute bounds for
 * @param analysisStates - Array of analysis states (e.g., snapshots and live analysis)
 * @param numSnapshots - Number of most recent analyses to include (default: 8)
 * @returns Tuple of [minLower, maxUpper] or [undefined, undefined] if no data
 */
export const computeBoundsForMetric = (
  metricName: string | undefined,
  analysisStates: AnalysisState[],
  numSnapshots: number = 8,
): [number | undefined, number | undefined] => {
  let minLower: number | undefined = undefined;
  let maxUpper: number | undefined = undefined;

  // Include up to numSnapshots most recent analyses
  const analysesToCheck = analysisStates.slice(0, numSnapshots).filter((s) => s.data !== undefined);

  // Iterate through all analyses and find min/max
  if (analysisStates.length > 0 && analysisStates[0].data?.type === 'freq') {
    if (!metricName) return [undefined, undefined];

    for (const analysis of analysesToCheck) {
      const effectSizes = analysis.effectSizesByMetric?.get(metricName);
      if (!effectSizes) continue;

      for (const effectSize of effectSizes) {
        const { ci95Lower, ci95Upper } = effectSize;
        minLower = minLower === undefined ? ci95Lower : Math.min(minLower, ci95Lower);
        maxUpper = maxUpper === undefined ? ci95Upper : Math.max(maxUpper, ci95Upper);
      }
    }
  } else if (analysisStates.length > 0 && analysisStates[0].data?.type === 'bandit') {
    for (const analysis of analysesToCheck) {
      const banditEffects = analysis.banditEffects;
      if (!banditEffects) continue;

      for (const effect of banditEffects) {
        const { postPredabsCI95Lower, priorPredabsCI95Lower, postPredabsCI95Upper, priorPredabsCI95Upper } = effect;
        const currentMinLower = Math.min(postPredabsCI95Lower, priorPredabsCI95Lower);
        const currentMaxUpper = Math.max(postPredabsCI95Upper, priorPredabsCI95Upper);
        minLower = minLower === undefined ? currentMinLower : Math.min(minLower, currentMinLower);
        maxUpper = maxUpper === undefined ? currentMaxUpper : Math.max(maxUpper, currentMaxUpper);
      }
    }
  }
  return [minLower, maxUpper];
};

/**
 * Generates effect size data for our forest plot visualization from a metric analysis.
 *
 * @param analysis - The metric analysis containing arm-level analyses
 * @param alpha - The significance threshold (e.g., 0.05 for 95% confidence)
 * @returns Array of effect size data for each arm
 */
const _generateFreqEffectSizeData = (analysis: MetricAnalysis, alpha: number): EffectSizeData[] => {
  // Extract data for visualization
  const controlArmIndex = analysis.arm_analyses.findIndex((a) => a.is_baseline);
  const controlArmAnalysis = analysis.arm_analyses[controlArmIndex];
  const controlEstimate = controlArmAnalysis.estimate; // regression intercept

  // Our data structure for visualization
  const effectSizes: EffectSizeData[] = analysis.arm_analyses.map((armAnalysis, index) => {
    const isBaseline = armAnalysis.is_baseline;
    const armId = armAnalysis.arm_id || 'MISSING_ARM_ID'; // should be impossible
    const armName = armAnalysis.arm_name || `Arm ${index}`;

    const estimate = armAnalysis.estimate; // regression coefficient
    const stdError = armAnalysis.std_error;
    const pValue = armAnalysis.p_value;
    const tStat = armAnalysis.t_stat;
    const significant = !isBaseline && !!(pValue !== null && pValue < alpha);
    const invalidStatTest =
      pValue === null || pValue === undefined || tStat === null || tStat === undefined || stdError === null;
    const isMissingAllValues = armAnalysis.num_missing_values < 0;

    const absDifference = isBaseline ? 0 : estimate;
    const absEffect = absDifference + controlEstimate;
    const relEffectPct = ((absEffect - controlEstimate) / controlEstimate) * 100;
    // Calculate 95% confidence interval
    // TODO: backend should return CIs; this approximation is for z-tests, and not appropriate for small sample sizes.
    const ci95 = stdError === null ? NaN : 1.96 * stdError;
    const ci95Lower = absDifference - ci95;
    const ci95Upper = absDifference + ci95;
    const absCI95Lower = absEffect - ci95;
    const absCI95Upper = absEffect + ci95;

    return {
      isBaseline,
      armId,
      armName,
      baselineEffect: controlEstimate,
      absDifference,
      absEffect,
      relEffectPct,
      stdError,
      ci95,
      ci95Lower,
      ci95Upper,
      absCI95Lower,
      absCI95Upper,
      pValue,
      significant,
      invalidStatTest,
      isMissingAllValues,
    };
  });

  return effectSizes;
};

/**
 * Generates effect data for our forest plot visualization for the bandit experiments.
 *
 * @param analysis - The metric analysis containing arm-level analyses
 * @param alpha - The significance threshold (e.g., 0.05 for 95% confidence)
 * @returns Array of effect data for each arm
 */
const _generateBanditEffectData = (analysis: BanditExperimentAnalysisResponse): BanditEffectData[] => {
  // Our data structure for visualization
  const postMinMean = Math.min(...analysis.arm_analyses.map((d) => d.post_pred_mean));
  const priorMinMean = Math.min(...analysis.arm_analyses.map((d) => d.prior_pred_mean));
  const effects: BanditEffectData[] = analysis.arm_analyses.map((armAnalysis, index) => {
    const armId = armAnalysis.arm_id || 'MISSING_ARM_ID'; // should be impossible
    const armName = armAnalysis.arm_name || `Arm ${index}`;

    // Calculate 95% confidence interval for posterior predictive distribution
    const postPredMean = armAnalysis.post_pred_mean;
    const postPredStd = armAnalysis.post_pred_stdev;
    const postPredCI95Lower = armAnalysis.post_pred_ci_lower;
    const postPredCI95Upper = armAnalysis.post_pred_ci_upper;
    const postPredabsCI95Lower = postPredCI95Lower + (postPredMean == postMinMean ? 0 : postMinMean);
    const postPredabsCI95Upper = postPredCI95Upper + (postPredMean == postMinMean ? 0 : postMinMean);
    const postPredCI95 = (postPredCI95Upper - postPredCI95Lower) / 2;

    // Calculate 95% confidence interval for prior predictive distribution
    const priorPredMean = armAnalysis.prior_pred_mean;
    const priorPredStd = armAnalysis.prior_pred_stdev;
    const priorPredCI95Lower = armAnalysis.prior_pred_ci_lower;
    const priorPredCI95Upper = armAnalysis.prior_pred_ci_upper;
    const priorPredCI95 = (priorPredCI95Upper - priorPredCI95Lower) / 2;
    const priorPredabsCI95Lower = priorPredCI95Lower + (priorPredMean == priorMinMean ? 0 : priorMinMean);
    const priorPredabsCI95Upper = priorPredCI95Upper + (priorPredMean == priorMinMean ? 0 : priorMinMean);

    return {
      armId,
      armName,
      postPredMean,
      postPredStd,
      postPredCI95Lower,
      postPredCI95Upper,
      postPredCI95,
      postPredabsCI95Lower,
      postPredabsCI95Upper,
      priorPredMean,
      priorPredStd,
      priorPredCI95Lower,
      priorPredCI95Upper,
      priorPredCI95,
      priorPredabsCI95Lower,
      priorPredabsCI95Upper,
    };
  });

  return effects;
};

/**
 * Computes axis bounds (min/max) from an array of numeric values with padding and rounding.
 * This is used to create stable, nicely-formatted chart axes.
 *
 * @param values - Array of numeric values to compute bounds for
 * @param minProp - Optional minimum bound hint
 * @param maxProp - Optional maximum bound hint
 * @param padding - Fraction of range to add as padding (default: 0.1 for 10%)
 * @returns Tuple of [min, max] bounds
 */
export const computeAxisBounds = (
  values: number[],
  minProp?: number,
  maxProp?: number,
  padding: number = 0.1,
): [number, number] => {
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

  // Round to nicer whole numbers depending on the magnitude of the range.
  const paddedRange = range * (1 + 2 * padding);
  if (paddedRange >= 0.1 && padding >= 0.02) {
    const exp = Math.log10(paddedRange);
    const x = exp >= 0 ? Math.floor(exp) : Math.ceil(exp);
    const unit = Math.pow(10, x - 1);
    min = Math.floor(min / unit) * unit;
    max = Math.ceil(max / unit) * unit;
  }

  // If the domain appears to be essentially a singular value, make it larger to avoid a 0-width.
  if (Math.abs(max - min) < 0.0000001) {
    min = min - 1;
    max = max + 1;
  }

  return [min, max];
};

/**
 * Helper function to calculate x-axis jitter offset
 */
export const calculateJitterOffset = (armIndex: number, totalArms: number): number => {
  const jitterSpacing = 6; // pixels between each arm's position
  const totalWidth = (totalArms - 1) * jitterSpacing;
  return armIndex * jitterSpacing - totalWidth / 2;
};

/**
 * Get color for an arm based on its index, baseline status, and selection state.
 */
export const getArmColor = (armIndex: number, isBaseline: boolean, isSelected: boolean): string => {
  if (isBaseline) {
    return isSelected ? CONTROL_COLOR : INACTIVE_CONTROL_COLOR;
  }

  const modulus = ARM_COLORS.length;
  const colorIndex = (((armIndex - 1) % modulus) + modulus) % modulus;
  return isSelected ? ARM_COLORS[colorIndex] : INACTIVE_ARM_COLORS[colorIndex];
};

/**
 * Get color for an arm based on its index and baseline status.
 *
 * Returns a color string enum usable with Text color props.
 */
export const getArmColorEnumForText = (armIndex: number, isBaseline: boolean) => {
  if (isBaseline) {
    return 'gray';
  }
  const modulus = ARM_COLORS_FOR_TEXT.length;
  const colorIndex = (((armIndex - 1) % modulus) + modulus) % modulus;
  return ARM_COLORS_FOR_TEXT[colorIndex];
};
/**
 * Determines the color for a confidence interval based on significance.
 *
 * @param baseColor - The default color to use when not significant
 * @param significance - The significance of the arm's mean effect
 * @param isSelected - Whether the arm is selected
 * @returns The color string for the confidence interval
 */
export const getColorWithSignificance = (
  baseColor: string,
  significance: Significance,
  isSelected: boolean,
): string => {
  if (significance === Significance.No) {
    return isSelected ? DEFAULT_POINT_COLOR : baseColor;
  }
  return significance === Significance.Positive
    ? isSelected
      ? POSITIVE_COLOR
      : INACTIVE_POSITIVE_COLOR
    : isSelected
      ? NEGATIVE_COLOR
      : INACTIVE_NEGATIVE_COLOR;
};

/**
 * Transforms analysis states into chart data suitable for timeseries visualization.
 * Processes multiple analysis snapshots and converts them into a format ready for Recharts.
 *
 * @param analysisStates - Array of analysis states (e.g., snapshots and live analysis)
 * @param metricName - The metric field name to extract effect sizes for (frequentist experiments only)
 * @returns Object containing chartData, armMetadata, and date range for rendering
 */
export const transformAnalysisForForestTimeseriesPlot = (
  analysisStates: AnalysisState[],
  metricName: string,
): {
  timeseriesData: TimeSeriesDataPoint[];
  armMetadata: ArmMetadata[];
  minDate: Date;
  maxDate: Date;
} => {
  const timeseriesData: TimeSeriesDataPoint[] = [];

  // Sort by date ascending (oldest to newest)
  const sortedStates = [...analysisStates].sort((a, b) => a.updated_at.getTime() - b.updated_at.getTime());

  // Filter out states that don't have effect sizes for this metric
  let validStates: AnalysisState[] = [];
  if (isFrequentistAnalysis(sortedStates[0]?.data)) {
    validStates = sortedStates.filter((state) => state.effectSizesByMetric?.has(metricName));
  } else if (isBanditAnalysis(sortedStates[0]?.data)) {
    validStates = sortedStates.filter((state) => state.banditEffects !== undefined);
  }

  if (validStates.length === 0) {
    const now = new Date();
    return { timeseriesData: [], armMetadata: [], minDate: now, maxDate: now };
  }

  // Extract arm metadata from the first valid data point
  const armMetadata: ArmMetadata[] = [];
  const firstState = isFrequentistAnalysis(validStates[0].data)
    ? validStates[0].effectSizesByMetric?.get(metricName)
    : validStates[0].banditEffects;
  if (firstState) {
    for (const e of firstState) {
      armMetadata.push({
        id: e.armId,
        name: e.armName,
        isBaseline: 'isBaseline' in e ? e.isBaseline : false,
      });
    }
  }

  // Transform each state into a timeseries data point
  for (const state of validStates) {
    const armEffects = new Map<string, ArmDataPoint>();

    if (isFrequentistAnalysis(state.data)) {
      const effectSizes = state.effectSizesByMetric?.get(metricName);
      if (!effectSizes) continue;

      for (const effectSize of effectSizes) {
        // Determine significance based on the effect
        let significance = Significance.No;
        if (effectSize.significant) {
          significance = effectSize.absDifference > 0 ? Significance.Positive : Significance.Negative;
        }

        armEffects.set(effectSize.armId, {
          absMean: effectSize.absEffect,
          upperCI: effectSize.absCI95Upper,
          lowerCI: effectSize.absCI95Lower,
          significance,
        });
      }
    } else if (isBanditAnalysis(state.data)) {
      const banditEffects = state.banditEffects;
      if (!banditEffects) continue;

      for (const effect of banditEffects) {
        // Bandit experiments don't have a baseline comparison, so significance is always 'no'
        armEffects.set(effect.armId, {
          absMean: effect.postPredMean,
          upperCI: effect.postPredCI95Upper,
          lowerCI: effect.postPredCI95Lower,
          significance: Significance.No,
        });
      }
    }

    // Truncate timestamp to start of day UTC to align with ticks.
    // If we need the precision in the future, just set updated_at directly.
    const truncatedDate = new Date(state.updated_at);
    truncatedDate.setUTCHours(0, 0, 0, 0);
    timeseriesData.push({
      date: formatDateUtcYYYYMMDD(truncatedDate),
      dateTimestampMs: truncatedDate.getTime(),
      armEffects: armEffects,
      key: state.key,
    });
  }

  // Compute min and max dates for the axis domain (truncated to start of day)
  const minDate = new Date(validStates[0].updated_at);
  minDate.setUTCHours(0, 0, 0, 0);
  const maxDate = new Date(validStates[validStates.length - 1].updated_at);
  maxDate.setUTCHours(0, 0, 0, 0);

  return { timeseriesData, armMetadata, minDate, maxDate };
};

// Re-export the interfaces and types for backward compatibility
export type {
  EffectSizeData,
  BanditEffectData,
  AnalysisState,
  ArmDataPoint,
  TimeSeriesDataPoint,
  ArmMetadata,
} from './forest-plot-models';
export { Significance } from './forest-plot-models';
