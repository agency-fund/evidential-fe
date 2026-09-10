import { formatDateUtcYYYYMMDD } from '@/services/date-utils';
import { z } from 'zod';
import {
  AnyFrequentistDesignSpec,
  CMABExperimentSpecExperimentType,
  CreateExperimentRequest,
  DesignSpecMetricRequest,
  MABDwhExperimentSpecExperimentType,
  MABExperimentSpecExperimentType,
  OnlineFrequentistExperimentSpecExperimentType,
  PowerResponse,
  PreassignedFrequentistExperimentSpecExperimentType,
  Stratum,
} from '@/api/methods.schemas';
import { createExperimentBody } from '@/api/admin.zod';
import { ExperimentFormData, getMabDwhTarget } from './experiment-form-types';
import { isFreqExperimentType, isFrequentistSpec, getPowerAnalysis } from '@/services/experiment-utils';

/**
 * Drops entries whose `field_name` matches `fieldNameToRemove` (e.g. exclude the primary key from
 * stratum lists). Always returns an array; `undefined` input is treated as empty.
 */
export function removeFieldByName<T extends { field_name: string }>(
  fields: T[] | undefined,
  fieldNameToRemove: string | undefined,
): T[] {
  if (!fields?.length) return [];
  if (!fieldNameToRemove) return fields;
  return fields.filter((f) => f.field_name !== fieldNameToRemove);
}

export const getReasonableStartDate = (): string => {
  const date = new Date();
  date.setDate(0);
  date.setMonth(date.getMonth() + 2);
  return formatDateUtcYYYYMMDD(date);
};

export const getReasonableEndDate = (): string => {
  const date = new Date();
  date.setDate(0);
  date.setMonth(date.getMonth() + 3);
  return formatDateUtcYYYYMMDD(date);
};

const zodNumberFromForm = (configure?: (num: z.ZodNumber) => z.ZodNumber) =>
  z.preprocess(
    (value) => {
      if (value === undefined) return undefined;
      if (value instanceof String) value = value.trim();
      if (value === '') return undefined;
      return Number(value);
    },
    configure ? configure(z.number()) : z.number(),
  );

const zodMde = zodNumberFromForm((num) => num.int().safe().min(0).max(100));

const getPrimaryMetricClusterStats = (data: ExperimentFormData) => {
  if (!data.clusterKey) return undefined;
  const icc = data.clusterIcc;
  const cv = data.clusterCv;
  const avgClusterSize = data.clusterAvgClusterSize;
  if (icc === undefined && cv === undefined && avgClusterSize === undefined) return undefined;
  return { icc, cv, avg_cluster_size: avgClusterSize };
};

export const getClusterStatsFromPowerCheckResponse = (
  data: ExperimentFormData,
  response: PowerResponse,
): Pick<ExperimentFormData, 'clusterIcc' | 'clusterCv' | 'clusterAvgClusterSize'> | undefined => {
  if (!data.clusterKey || !data.primaryMetric) return undefined;

  const primary = getPowerAnalysis(response, data.primaryMetric.metric.field_name);
  const metricSpec = primary?.metric_spec;
  if (!metricSpec) return undefined;

  return {
    clusterIcc: metricSpec.icc ?? undefined,
    clusterCv: metricSpec.cv ?? undefined,
    clusterAvgClusterSize: metricSpec.avg_cluster_size ?? undefined,
  };
};

export function convertToFrequentistDesignSpec(data: ExperimentFormData): AnyFrequentistDesignSpec {
  if (!isFreqExperimentType(data.experimentType)) {
    throw new Error('Frequentist configuration is required.');
  }
  if (!data.name || !data.startDate || !data.endDate || !data.tableName || !data.primaryKey) {
    throw new Error('Experiment name, start date, end date, table name, and primary key are all required.');
  }

  const metrics: DesignSpecMetricRequest[] = [];

  const primaryClusterStats = getPrimaryMetricClusterStats(data);

  if (data.primaryMetric?.metric.field_name) {
    zodMde.parse(data.primaryMetric.mde, { path: ['primaryMetric', 'mde'] });
    metrics.push({
      field_name: data.primaryMetric.metric.field_name,
      metric_pct_change: Number(data.primaryMetric.mde) / 100.0,
      ...(primaryClusterStats
        ? {
            icc: primaryClusterStats.icc ?? null,
            cv: primaryClusterStats.cv ?? null,
            avg_cluster_size: primaryClusterStats.avg_cluster_size ?? null,
          }
        : {}),
    });
  }

  (data.secondaryMetrics ?? []).forEach((metric) => {
    zodMde.parse(metric.mde, { path: ['secondaryMetrics', metric.metric.field_name, 'mde'] });
    metrics.push({
      field_name: metric.metric.field_name,
      metric_pct_change: Number(metric.mde) / 100.0,
    });
  });

  const strata: Stratum[] = removeFieldByName(data.strata, data.primaryKey).map((f) => ({
    field_name: f.field_name,
  }));

  const designSpec: Record<string, unknown> = {
    experiment_name: data.name,
    description: data.hypothesis,
    design_url: data.designUrl || null,
    start_date: new Date(Date.parse(data.startDate)).toISOString(),
    end_date: new Date(Date.parse(data.endDate)).toISOString(),
    arms: (data.arms ?? []).map((arm) => ({ ...arm, arm_id: null })),
    table_name: data.tableName,
    primary_key: data.primaryKey,
    strata,
    metrics,
    filters: data.filters ?? [],
    power: data.power ? Number(data.power) / 100.0 : 0.8,
    alpha: data.confidence ? 1 - Number(data.confidence) / 100.0 : 0.05,
    experiment_type: data.experimentType,
  };
  if (data.experimentType === 'freq_preassigned' && data.clusterKey) {
    designSpec.cluster_key = data.clusterKey;
  }
  if (data.experimentType === 'freq_preassigned' && data.clusterKey && data.desiredNClusters !== undefined) {
    designSpec.desired_n_clusters = data.desiredNClusters;
  }
  if (data.experimentType === 'freq_preassigned' && data.desiredN !== undefined) {
    designSpec.desired_n = data.desiredN;
  }

  const spec = createExperimentBody.strict().parse({ design_spec: designSpec }).design_spec;
  if (!isFrequentistSpec(spec)) {
    throw new Error('Frequentist configuration is required.');
  }
  return spec;
}

/** Number of points requested for the MDE-vs-sample-size power curve. */
export const POWER_CURVE_POINTS = 10;

/**
 * Sample sizes spaced uniformly in 1/sqrt(n) from minN to maxN inclusive, ascending, deduplicated
 * after rounding. Because MDE is proportional to 1/sqrt(n), the resulting curve points are evenly
 * spaced vertically, which keeps the plotted curve smooth with few points at any range width.
 */
export function sqrtSpacedSampleSizes(minN: number, maxN: number, count: number): number[] {
  if (count < 2 || maxN <= minN) return [Math.round(maxN)];
  const uStart = 1 / Math.sqrt(minN);
  const uEnd = 1 / Math.sqrt(maxN);
  const sizes: number[] = [];
  for (let i = 0; i < count; i++) {
    const u = uStart + (i * (uEnd - uStart)) / (count - 1);
    sizes.push(Math.round(1 / (u * u)));
  }
  return [...new Set(sizes)];
}

/** The next round axis endpoint at or above value, on a 1 / 2 / 2.5 / 5 / 10 ladder. */
function niceCeiling(value: number): number {
  const decade = 10 ** Math.floor(Math.log10(value));
  for (const mult of [1, 2, 2.5, 5, 10]) {
    if (value <= mult * decade) return mult * decade;
  }
  return 10 * decade;
}

/**
 * The sample sizes to request for the power curve, sqrt-spaced between a range chosen so the
 * curve visibly crosses the user's target MDE:
 *
 * - Normal case (minimum within the available population): from the required minimum to the
 *   available population, with a short overhang on each side (a fifth past the available
 *   population, and the same ratio below the minimum) so the curve does not end abruptly at
 *   either landmark. Custom selections below the minimum are drawn by the chart itself.
 * - Under-powered case (minimum beyond the available population): from a tenth of the available
 *   population to a round number covering the required minimum, so the user sees both what is
 *   detectable now and where their target sits. Only a truly far-off requirement (beyond 50x
 *   the available population) falls back to a 10x axis, so an unreachable landmark cannot crush
 *   the readable region.
 *
 * The available population and the required minimum are inserted as explicit points: the first
 * is "what can I detect with everyone I have," the second makes the curve meet the target MDE
 * exactly.
 */
export function powerCurveSizes(targetN: number | undefined, availableN: number): number[] {
  if (availableN < 2) return [];
  const underPowered = targetN === undefined || targetN >= availableN;
  if (!underPowered) {
    const sizes = sqrtSpacedSampleSizes(targetN, availableN, POWER_CURVE_POINTS);
    sizes.unshift(Math.max(2, Math.round(targetN / 1.2)));
    sizes.push(Math.round(availableN * 1.2));
    return [...new Set(sizes)].sort((a, b) => a - b);
  }
  const minN = Math.max(2, Math.round(availableN / 10));
  const maxN =
    targetN === undefined ? availableN : targetN > availableN * 50 ? availableN * 10 : Math.round(niceCeiling(targetN));
  const sizes = sqrtSpacedSampleSizes(minN, maxN, POWER_CURVE_POINTS);
  for (const size of [availableN, targetN]) {
    if (size !== undefined && size >= minN && size <= maxN && !sizes.includes(size)) {
      sizes.push(size);
    }
  }
  sizes.sort((a, b) => a - b);
  return sizes;
}

/**
 * Returns a copy of the design spec whose metrics carry the baseline stats (and, for cluster
 * designs, ICC/CV/average cluster size) from a prior power check response, so the server reuses
 * them instead of re-querying the data warehouse. Metrics without usable stats in the response
 * are passed through unchanged; the caller must only echo a response produced by the same design.
 */
export function withEchoedBaselineStats(
  spec: AnyFrequentistDesignSpec,
  response: PowerResponse,
): AnyFrequentistDesignSpec {
  const statsByName = new Map(response.analyses.map((a) => [a.metric_spec.field_name, a.metric_spec]));
  const metrics = spec.metrics.map((metric) => {
    const stats = statsByName.get(metric.field_name);
    if (
      stats == null ||
      stats.metric_type == null ||
      stats.metric_baseline == null ||
      stats.available_n == null ||
      stats.available_nonnull_n == null
    ) {
      return metric;
    }
    const echoed: DesignSpecMetricRequest = {
      ...metric,
      metric_type: stats.metric_type,
      metric_baseline: stats.metric_baseline,
      metric_stddev: stats.metric_stddev ?? null,
      available_n: stats.available_n,
      available_nonnull_n: stats.available_nonnull_n,
    };
    if (metric.icc == null && stats.icc != null && stats.avg_cluster_size != null && stats.cv != null) {
      echoed.icc = stats.icc;
      echoed.avg_cluster_size = stats.avg_cluster_size;
      echoed.cv = stats.cv;
    }
    return echoed;
  });
  return { ...spec, metrics };
}

export function convertToBanditCreateRequest(data: ExperimentFormData): CreateExperimentRequest {
  if (data.bandit === undefined) {
    throw new Error('Bandit configuration is required.');
  }
  if (!data.name || !data.startDate || !data.endDate) {
    throw new Error('Experiment name, start date, and end date are all required.');
  }
  const { experimentType, outcomeType, priorType, arms } = data.bandit;
  const { enableAutofail, autofailWindow, autofailOutcomeValue } = data.autofail ?? {};

  // Map bandit arms to standard arms format with prior parameters
  const standardArms = arms.map((arm) => ({
    arm_id: null,
    arm_name: arm.arm_name,
    arm_description: arm.arm_description || '',
    arm_weight: arm.arm_weight,
    // Populate only the active prior parameter family.
    alpha_init: priorType === 'beta' && arm.alpha_prior !== undefined ? arm.alpha_prior : null,
    beta_init: priorType === 'beta' && arm.beta_prior !== undefined ? arm.beta_prior : null,
    mu_init: priorType === 'normal' && arm.mean_prior !== undefined ? arm.mean_prior : null,
    sigma_init: priorType === 'normal' && arm.stddev_prior !== undefined ? arm.stddev_prior : null,
  }));

  // Map contexts for CMAB experiments
  let standardContexts = null;
  if (experimentType === 'cmab_online' && data.bandit.contexts.length > 0) {
    standardContexts = data.bandit.contexts.map((context) => ({
      context_id: null,
      context_name: context.name,
      context_description: context.description || '',
      value_type: context.type,
    }));
  }

  const designSpec: Record<string, unknown> = {
    experiment_name: data.name,
    experiment_type: experimentType,
    arms: standardArms,
    end_date: new Date(Date.parse(data.endDate)).toISOString(),
    start_date: new Date(Date.parse(data.startDate)).toISOString(),
    description: data.hypothesis,
    design_url: data.designUrl || null,
    prior_type: priorType,
    reward_type: outcomeType,
    contexts: standardContexts,
    desired_n: 0,
    enable_autofail: enableAutofail ?? false,
    autofail_window: autofailWindow ?? 24,
    autofail_outcome_value: autofailOutcomeValue ?? 0,
  };

  // A MAB experiment bound to a DWH target column is created as the distinct mab_online_dwh spec,
  // carrying the table / primary key / target column. Without a target it stays API-only (mab_online).
  const dwhTarget = getMabDwhTarget(data);
  if (dwhTarget) {
    designSpec.experiment_type = MABDwhExperimentSpecExperimentType.mab_online_dwh;
    designSpec.table_name = dwhTarget.tableName;
    designSpec.primary_key = dwhTarget.primaryKey;
    designSpec.target_field_name = dwhTarget.targetFieldName;
  }

  return createExperimentBody.strict().parse({
    design_spec: designSpec,
    webhooks: data.selectedWebhookIds && data.selectedWebhookIds.length > 0 ? data.selectedWebhookIds : [],
  });
}

export const ExperimentTypeOptions = [
  {
    value: PreassignedFrequentistExperimentSpecExperimentType.freq_preassigned,
    title: 'Preassigned A/B Testing',
    badge: 'A/B',
    description:
      'Participants are assigned to experiment arms up front. Use this when your sample size is fixed.\n' +
      'If your intervention targets whole groups at a time, such as a school or village, ' +
      'you can also assign all participants in a group to the same arm.',
  },
  {
    value: OnlineFrequentistExperimentSpecExperimentType.freq_online,
    title: 'Online A/B Testing',
    badge: 'A/B',
    description:
      'Participants are assigned to experiment arms dynamically as they arrive. Better for real-time experiments with unknown traffic.',
  },
  {
    value: MABExperimentSpecExperimentType.mab_online,
    title: 'Multi-Armed Bandit',
    badge: 'MAB',
    description:
      'Adaptive allocation that learns and optimizes automatically. Minimizes opportunity cost by converging to the best performing variant.',
  },
  {
    value: CMABExperimentSpecExperimentType.cmab_online,
    title: 'Contextual Multi-Armed Bandit',
    badge: 'CMAB',
    description:
      'Context-aware optimization for personalized experiences. Adapts recommendations based on user or environmental context.',
  },
];

// mab_online_dwh has no wizard card, so its label isn't in ExperimentTypeOptions; used for display.
export const MAB_DWH_LABEL = 'Multi-Armed Bandit (DWH-connected)';

/** Human-readable label for an experiment type. Single source of truth for type display names. */
export function experimentTypeLabel(experimentType: string): string {
  if (experimentType === MABDwhExperimentSpecExperimentType.mab_online_dwh) {
    return MAB_DWH_LABEL;
  }
  return ExperimentTypeOptions.find((v) => v.value === experimentType)?.title ?? experimentType;
}
