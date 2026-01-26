import { formatDateUtcYYYYMMDD } from '@/services/date-utils';
import { z } from 'zod';
import {
  CreateExperimentRequest,
  DesignSpecInput,
  DesignSpecMetricRequest,
  OnlineFrequentistExperimentSpecInput,
  PreassignedFrequentistExperimentSpecInput,
  Stratum,
} from '@/api/methods.schemas';
import { createExperimentBody } from '@/api/admin.zod';
import { ExperimentFormData } from './experiment-form-def';

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

  if (data.experimentType === 'freq_preassigned') {
    return {
      ...commonFields,
      experiment_type: 'freq_preassigned',
    } as PreassignedFrequentistExperimentSpecInput;
  }

  return {
    ...commonFields,
    experiment_type: 'freq_online',
  } as OnlineFrequentistExperimentSpecInput;
}

export function convertToBanditCreateRequest(data: ExperimentFormData): CreateExperimentRequest {
  // Map bandit arms to standard arms format with prior parameters
  const standardArms = (data.bandit_arms ?? []).map((arm) => ({
    arm_id: null,
    arm_name: arm.arm_name,
    arm_description: arm.arm_description || '',
    // Beta distribution params (for binary outcomes)
    alpha_init: arm.alpha_prior !== undefined ? arm.alpha_prior : null,
    beta_init: arm.beta_prior !== undefined ? arm.beta_prior : null,
    // Normal distribution params (for real-valued outcomes)
    mu_init: arm.mean_prior !== undefined ? arm.mean_prior : null,
    sigma_init: arm.stddev_prior !== undefined ? arm.stddev_prior : null,
  }));

  // Map contexts for CMAB experiments
  let standardContexts = null;
  if (data.experimentType === 'cmab_online' && data.contexts) {
    standardContexts = data.contexts.map((context) => ({
      context_id: null,
      context_name: context.name,
      context_description: context.description || '',
      value_type: context.type,
    }));
  }

  // Determine prior type from experiment type and outcome type
  const priorType = data.experimentType === 'mab_online' && data.outcomeType === 'binary' ? 'beta' : 'normal';

  return createExperimentBody.parse({
    design_spec: {
      experiment_name: data.name!,
      participant_type: 'user',
      experiment_type: data.experimentType,
      arms: standardArms,
      end_date: new Date(Date.parse(data.endDate!)).toISOString(),
      start_date: new Date(Date.parse(data.startDate!)).toISOString(),
      description: data.hypothesis ?? '',
      design_url: data.designUrl ?? null,
      prior_type: priorType,
      reward_type: data.outcomeType === 'binary' ? 'binary' : 'real-valued',
      contexts: standardContexts,
    },
    webhooks: data.selectedWebhookIds && data.selectedWebhookIds.length > 0 ? data.selectedWebhookIds : [],
  });
}
