import { createExperimentBody } from '@/api/admin.zod';
import {
  AnyFrequentistDesignSpecInput,
  CMABExperimentSpecInputExperimentType,
  CreateExperimentRequest,
  DesignSpecMetricRequest,
  MABExperimentSpecInputExperimentType,
  OnlineFrequentistExperimentSpecInputExperimentType,
  PreassignedFrequentistExperimentSpecInputExperimentType,
  Stratum,
} from '@/api/methods.schemas';
import { getCanonicalRewardType } from '@/app/experiments/create/experiment-form/experiment-bandit-helpers';
import { formatDateUtcYYYYMMDD } from '@/services/date-utils';
import { z } from 'zod';
import { ExperimentFormData } from './experiment-form-def';
import { isFreqExperimentType, isFrequentistSpec } from './experiment-form-types';

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

export function convertToFrequentistDesignSpec(data: ExperimentFormData): AnyFrequentistDesignSpecInput {
  if (!isFreqExperimentType(data.experimentType)) {
    throw new Error('Frequentist configuration is required.');
  }
  if (!data.name || !data.tableName || !data.primaryKey) {
    throw new Error('Experiment name, table name, and primary key are all required.');
  }

  const metrics: DesignSpecMetricRequest[] = [];

  if (data.primaryMetric?.metric.field_name) {
    zodMde.parse(data.primaryMetric.mde, { path: ['primaryMetric', 'mde'] });
    metrics.push({
      field_name: data.primaryMetric.metric.field_name,
      metric_pct_change: Number(data.primaryMetric.mde) / 100.0,
    });
  }

  (data.secondaryMetrics ?? []).forEach((metric) => {
    zodMde.parse(metric.mde, {
      path: ['secondaryMetrics', metric.metric.field_name, 'mde'],
    });
    metrics.push({
      field_name: metric.metric.field_name,
      metric_pct_change: Number(metric.mde) / 100.0,
    });
  });

  const strata: Stratum[] = removeFieldByName(data.strata, data.primaryKey).map((f) => ({
    field_name: f.field_name,
  }));

  const commonFields = {
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
    // When the user has chosen a sample size (Use max-available or Custom on
    // the Power Analysis page), pass it through to the BE. The BE then runs
    // the power analysis in MDE mode and returns the achievable MDE plus the
    // cluster split that corresponds to the chosen N. Without this, the saved
    // experiment would carry the original recommended-size power analysis
    // even when the user picked a different N.
    ...(data.desiredN !== undefined ? { desired_n: data.desiredN } : {}),
  };

  // The FE-only "freq_cluster_preassigned" type is submitted to the BE as a
  // regular "freq_preassigned" experiment with `cluster_column` set on the
  // design spec (and `icc`/`cv`/`avg_cluster_size` set on each metric). The
  // BE has no separate enum value for cluster experiments — PR #163 treats
  // clustering as a parameter on the existing freq_preassigned type.
  const isClusterExperiment = data.experimentType === 'freq_cluster_preassigned';
  const wireExperimentType = isClusterExperiment ? 'freq_preassigned' : data.experimentType;

  const spec = createExperimentBody.strict().parse({
    design_spec: {
      ...commonFields,
      experiment_type: wireExperimentType,
    },
  }).design_spec;

  if (!isFrequentistSpec(spec)) {
    throw new Error('Frequentist configuration is required.');
  }

  // Inject cluster fields AFTER strict zod parsing. We do it here rather than
  // in commonFields because admin.zod.ts hasn't been regenerated to recognize
  // the cluster fields yet (orval regeneration is currently broken locally).
  // The backend accepts these fields per PR #163; we sidestep the FE zod
  // check rather than patch ~50 places in admin.zod.ts. Once orval is fixed
  // and admin.zod.ts is regenerated, this post-parse injection becomes
  // unnecessary.
  if (isClusterExperiment && data.clusterField) {
    const icc = data.clusterIcc !== undefined && data.clusterIcc !== '' ? Number(data.clusterIcc) : undefined;
    const cv = data.clusterCv !== undefined && data.clusterCv !== '' ? Number(data.clusterCv) : undefined;
    const avgClusterSize =
      data.clusterAvgSize !== undefined && data.clusterAvgSize !== '' ? Number(data.clusterAvgSize) : undefined;
    // biome-ignore lint/suspicious/noExplicitAny: see comment above re: orval.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const specAny = spec as any;
    specAny.cluster_key = data.clusterField.field_name;
    if (icc !== undefined && cv !== undefined && avgClusterSize !== undefined) {
      specAny.metrics = specAny.metrics.map((m: Record<string, unknown>) => ({
        ...m,
        icc,
        cv,
        avg_cluster_size: avgClusterSize,
      }));
    }
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

  return createExperimentBody.strict().parse({
    design_spec: {
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
    },
    webhooks: data.selectedWebhookIds && data.selectedWebhookIds.length > 0 ? data.selectedWebhookIds : [],
  });
}

export const ExperimentTypeOptions = [
  {
    value: PreassignedFrequentistExperimentSpecInputExperimentType.freq_preassigned,
    title: 'Preassigned A/B Testing',
    badge: 'A/B',
    description:
      'Participants are assigned to experiment arms at design time. Suitable for controlled experiments with fixed sample sizes.',
  },
  {
    value: 'freq_cluster_preassigned' as const,
    title: 'Cluster Preassigned A/B Testing',
    badge: 'Cluster',
    description:
      'Whole groups of participants (clusters such as schools, villages, or classrooms) are assigned to arms together at design time. Use when the intervention is naturally delivered at the group level.',
  },
  {
    value: OnlineFrequentistExperimentSpecInputExperimentType.freq_online,
    title: 'Online A/B Testing',
    badge: 'A/B',
    description:
      'Participants are assigned to experiment arms dynamically as they arrive. Better for real-time experiments with unknown traffic.',
  },
  {
    value: MABExperimentSpecInputExperimentType.mab_online,
    title: 'Multi-Armed Bandit',
    badge: 'MAB',
    description:
      'Adaptive allocation that learns and optimizes automatically. Minimizes opportunity cost by converging to the best performing variant.',
  },
  {
    value: CMABExperimentSpecInputExperimentType.cmab_online,
    title: 'Contextual Multi-Armed Bandit',
    badge: 'CMAB',
    description:
      'Context-aware optimization for personalized experiences. Adapts recommendations based on user or environmental context.',
  },
];
