import { z } from 'zod';
import { CreateExperimentRequest, DesignSpecMetricRequest } from '@/api/methods.schemas';
import { createExperimentBody } from '@/api/admin.zod';

import { ExperimentFormData, FrequentABFormData, MABFormData } from './types';

// Zod helper for validating string inputs as if they are numeric values.
export const zodNumberFromForm = (configure?: (num: z.ZodNumber) => z.ZodNumber) =>
  z.preprocess(
    (value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value instanceof String) {
        value = value.trim();
      }
      if (value === '') return undefined;
      return Number(value);
    },
    configure ? configure(z.number()) : z.number(),
  );

const zodMde = zodNumberFromForm((num) => num.int().safe().min(0).max(100));

export const convertFormDataToCreateExperimentRequest = (formData: ExperimentFormData): CreateExperimentRequest => {
  switch (formData.experimentType) {
    case 'freq_online':
    case 'freq_preassigned':
      return convertFrequentABFormData(formData);

    case 'mab_online':
      return convertMABFormData(formData);

    default:
      throw new Error(`Unknown experiment type: ${(formData as ExperimentFormData).experimentType}`);
  }
};

function convertFrequentABFormData(formData: FrequentABFormData): CreateExperimentRequest {
  const metrics: DesignSpecMetricRequest[] = [];

  if (formData.primaryMetric && formData.primaryMetric.metricName) {
    zodMde.parse(formData.primaryMetric.mde, { path: ['primaryMetric', 'mde'] });
    metrics.push({
      field_name: formData.primaryMetric.metricName,
      metric_pct_change: Number(formData.primaryMetric.mde) / 100.0,
    });
  }

  formData.secondaryMetrics.forEach((metric) => {
    zodMde.parse(metric.mde, { path: ['secondaryMetrics', metric.metricName, 'mde'] });
    metrics.push({
      field_name: metric.metricName,
      metric_pct_change: Number(metric.mde) / 100.0,
    });
  });

  return createExperimentBody.parse({
    design_spec: {
      participant_type: formData.participantType!,
      experiment_name: formData.name,
      experiment_type: formData.experimentType,
      arms: Array.from(formData.arms.map((arm) => ({ ...arm, arm_id: null }))),
      end_date: new Date(Date.parse(formData.endDate)).toISOString(),
      start_date: new Date(Date.parse(formData.startDate)).toISOString(),
      description: formData.hypothesis,
      filters: formData.filters,
      metrics: metrics,
      strata: [],
      power: Number(formData.power) / 100.0,
      alpha: 1 - Number(formData.confidence) / 100.0,
      experiment_id: null,
    },
    power_analyses: formData.powerCheckResponse,
    webhooks: formData.selectedWebhookIds.length > 0 ? formData.selectedWebhookIds : [],
  });
}

function convertMABFormData(formData: MABFormData): CreateExperimentRequest {
  // Map MAB arms to standard arms format

  const standardArms = formData.arms.map((arm) => ({
    arm_id: null,
    arm_name: arm.arm_name,
    arm_description: arm.arm_description || '',
    alpha_init: arm.alpha_prior?.toString() ? arm.alpha_prior : null,
    beta_init: arm.beta_prior?.toString() ? arm.beta_prior : null,
    mu_init: arm.mean_prior?.toString() ? arm.mean_prior : null,
    sigma_init: arm.stddev_prior?.toString() ? arm.stddev_prior : null,
  }));

  return createExperimentBody.parse({
    design_spec: {
      experiment_name: formData.name,
      participant_type: 'user',
      experiment_type: 'mab_online', // MAB experiments use online assignment
      arms: standardArms,
      end_date: new Date(Date.parse(formData.endDate)).toISOString(),
      start_date: new Date(Date.parse(formData.startDate)).toISOString(),
      description: formData.hypothesis,
      prior_type: formData.priorType,
      reward_type: formData.outcomeType,
    },
    webhooks: formData.selectedWebhookIds.length > 0 ? formData.selectedWebhookIds : [],
  });
}

// Validation helpers for different experiment types
export const validateFormData = (formData: ExperimentFormData): string[] => {
  const errors: string[] = [];

  // Common validation
  if (!formData.name?.trim()) {
    errors.push('Experiment name is required');
  }
  if (!formData.hypothesis?.trim()) {
    errors.push('Hypothesis is required');
  }
  if (!formData.startDate) {
    errors.push('Start date is required');
  }
  if (!formData.endDate) {
    errors.push('End date is required');
  }

  // Type-specific validation
  if (formData.experimentType === 'mab_online') {
    return [...errors, ...validateMABFormData(formData)];
  }

  return errors;
};

function validateMABFormData(formData: MABFormData): string[] {
  const errors: string[] = [];

  if (!formData.priorType) {
    errors.push('Prior distribution type is required');
  }
  if (!formData.outcomeType) {
    errors.push('Outcome type is required');
  }
  if (!formData.participantType) {
    errors.push('Participant type is required');
  }
  if (formData.arms.length < 2) {
    errors.push('At least 2 arms are required');
  }

  // Validate prior parameters
  formData.arms.forEach((arm, index) => {
    if (!arm.arm_name?.trim()) {
      errors.push(`Arm ${index + 1} name is required`);
    }

    const priorType = formData.outcomeType === 'binary' ? 'beta' : 'normal';
    if (priorType === 'beta') {
      if (!arm.alpha_prior || arm.alpha_prior <= 0) {
        errors.push(`Arm ${index + 1} Alpha prior must be greater than 0`);
      }
      if (!arm.beta_prior || arm.beta_prior <= 0) {
        errors.push(`Arm ${index + 1} Beta prior must be greater than 0`);
      }
    } else if (priorType === 'normal') {
      if (arm.mean_prior === undefined) {
        errors.push(`Arm ${index + 1} Mean prior is required`);
      }
      if (!arm.stddev_prior || arm.stddev_prior <= 0) {
        errors.push(`Arm ${index + 1} Standard deviation prior must be greater than 0`);
      }
    }
  });

  return errors;
}
