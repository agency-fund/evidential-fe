import { formatDateUtcYYYYMMDD } from '@/services/date-utils';
import { z } from 'zod';
import {
  CMABExperimentSpecInputExperimentType,
  CreateExperimentRequest,
  DesignSpecInput,
  DesignSpecMetricRequest,
  MABExperimentSpecInputExperimentType,
  OnlineFrequentistExperimentSpecInputExperimentType,
  PreassignedFrequentistExperimentSpecInputExperimentType,
  Stratum,
} from '@/api/methods.schemas';
import { createExperimentBody } from '@/api/admin.zod';
import { ExperimentFormData } from './experiment-form-def';
import { getCanonicalRewardType } from '@/app/experiments/create/experiment-form/experiment-bandit-helpers';

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

export function convertToDesignSpec(data: ExperimentFormData): DesignSpecInput {
  const metrics: DesignSpecMetricRequest[] = [];

  if (data.primaryMetric?.metric.field_name) {
    zodMde.parse(data.primaryMetric.mde, { path: ['primaryMetric', 'mde'] });
    metrics.push({
      field_name: data.primaryMetric.metric.field_name,
      metric_pct_change: Number(data.primaryMetric.mde) / 100.0,
    });
  }

  (data.secondaryMetrics ?? []).forEach((metric) => {
    zodMde.parse(metric.mde, { path: ['secondaryMetrics', metric.metric.field_name, 'mde'] });
    metrics.push({
      field_name: metric.metric.field_name,
      metric_pct_change: Number(metric.mde) / 100.0,
    });
  });

  const strata: Stratum[] = (data.strata ?? []).map((s) => ({ field_name: s.fieldName }));

  const commonFields = {
    participant_type: data.tableName!,
    experiment_name: data.name!,
    description: data.hypothesis ?? '',
    design_url: data.designUrl ?? null,
    start_date: new Date(Date.parse(data.startDate!)).toISOString(),
    end_date: new Date(Date.parse(data.endDate!)).toISOString(),
    arms: (data.arms ?? []).map((arm) => ({ ...arm, arm_id: null })),
    strata,
    metrics,
    filters: data.filters ?? [],
    power: data.power ? Number(data.power) / 100.0 : 0.8,
    alpha: data.confidence ? 1 - Number(data.confidence) / 100.0 : 0.05,
  };

  return createExperimentBody.strict().parse({
    design_spec: {
      ...commonFields,
      experiment_type: data.experimentType,
    },
  }).design_spec;
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
      participant_type: 'user',
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
