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
import { getCanonicalRewardType } from '@/app/experiments/create/experiment-form/experiment-bandit-helpers';
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
  if (!data.name || !data.tableName || !data.primaryKey) {
    throw new Error('Experiment name, table name, and primary key are all required.');
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
    description: data.hypothesis ?? '',
    design_url: data.designUrl ?? null,
    start_date: new Date(Date.parse(data.startDate!)).toISOString(),
    end_date: new Date(Date.parse(data.endDate!)).toISOString(),
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

export function convertToBanditCreateRequest(data: ExperimentFormData): CreateExperimentRequest {
  if (data.bandit === undefined) {
    throw new Error('Bandit configuration is required.');
  }
  const { experimentType, outcomeType, priorType, arms } = data.bandit;
  const canonicalRewardType = getCanonicalRewardType(outcomeType);

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
    experiment_name: data.name!,
    experiment_type: experimentType,
    arms: standardArms,
    end_date: new Date(Date.parse(data.endDate!)).toISOString(),
    start_date: new Date(Date.parse(data.startDate!)).toISOString(),
    description: data.hypothesis ?? '',
    design_url: data.designUrl ?? null,
    prior_type: priorType,
    reward_type: canonicalRewardType,
    contexts: standardContexts,
    desired_n: 0,
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
      'Participants are assigned to experiment arms at design time. Suitable for controlled experiments with fixed sample sizes.',
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
