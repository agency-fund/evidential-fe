import { z } from 'zod';
import { 
  CreateExperimentRequest, 
  DesignSpecMetricRequest,
} from '@/api/methods.schemas';
import { createExperimentBody } from '@/api/admin.zod';

import { ExperimentFormData, FrequentABFormData, MABFormData, BayesianABFormData, CMABFormData } from './types';

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

export const convertFormDataToCreateExperimentRequest = (
  formData: ExperimentFormData
): CreateExperimentRequest => {
  switch (formData.experimentType) {
    case 'frequent_ab':
      return convertFrequentABFormData(formData);

    case 'multi_armed_bandit':
      return convertMABFormData(formData);

    case 'bayesian_ab':
      return convertBayesianABFormData(formData);

    case 'contextual_bandit':
      return convertCMABFormData(formData);
    
    default:
      throw new Error(`Unknown experiment type: ${(formData as any).experimentType}`);
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
      experiment_type: formData.assignmentType, // Use assignmentType ('preassigned' or 'online')
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
  const standardArms = formData.arms.map(arm => ({
    arm_id: null,
    arm_name: arm.arm_name,
    arm_description: arm.arm_description || '',
  }));

  // Create minimal metrics array - MAB doesn't require specific metrics like A/B tests
  const metrics: DesignSpecMetricRequest[] = [
    {
      field_name: 'conversion', // Default conversion metric
      metric_pct_change: 0.1, // 10% default effect size
    }
  ];

  return createExperimentBody.parse({
    design_spec: {
      participant_type: formData.participantType!,
      experiment_name: formData.name,
      experiment_type: 'online', // MAB experiments use online assignment
      arms: standardArms,
      end_date: new Date(Date.parse(formData.endDate)).toISOString(),
      start_date: new Date(Date.parse(formData.startDate)).toISOString(),
      description: formData.hypothesis,
      filters: [], // MAB doesn't use complex filtering initially
      metrics: metrics,
      strata: [],
      power: 0.8, // Default power for MAB
      alpha: 0.05, // Default alpha for MAB
      experiment_id: null,
    },
    power_analyses: null, // MAB doesn't use power analysis
    webhooks: formData.selectedWebhookIds.length > 0 ? formData.selectedWebhookIds : [],
  });
}

function convertBayesianABFormData(formData: BayesianABFormData): CreateExperimentRequest {
  // Map Bayesian A/B arms to standard arms format
  const standardArms = formData.arms.map(arm => ({
    arm_id: null,
    arm_name: arm.arm_name,
    arm_description: arm.arm_description || '',
  }));

  // Create minimal metrics array - Bayesian A/B doesn't require specific metrics like traditional A/B tests
  const metrics: DesignSpecMetricRequest[] = [
    {
      field_name: 'conversion', // Default conversion metric
      metric_pct_change: 0.1, // 10% default effect size
    }
  ];

  return createExperimentBody.parse({
    design_spec: {
      participant_type: formData.participantType!,
      experiment_name: formData.name,
      experiment_type: 'online', // Bayesian A/B experiments use online assignment
      arms: standardArms,
      end_date: new Date(Date.parse(formData.endDate)).toISOString(),
      start_date: new Date(Date.parse(formData.startDate)).toISOString(),
      description: formData.hypothesis,
      filters: [], // Bayesian A/B doesn't use complex filtering initially
      metrics: metrics,
      strata: [],
      power: 0.8, // Default power for Bayesian A/B
      alpha: 0.05, // Default alpha for Bayesian A/B
      experiment_id: null,
    },
    power_analyses: null, // Bayesian A/B doesn't use power analysis
    webhooks: formData.selectedWebhookIds.length > 0 ? formData.selectedWebhookIds : [],
  });
}

function convertCMABFormData(formData: CMABFormData): CreateExperimentRequest {
  // Map CMAB arms to standard arms format
  const standardArms = formData.arms.map(arm => ({
    arm_id: null,
    arm_name: arm.arm_name,
    arm_description: arm.arm_description || '',
  }));

  // Create minimal metrics array - CMAB doesn't require specific metrics like traditional A/B tests
  const metrics: DesignSpecMetricRequest[] = [
    {
      field_name: 'conversion', // Default conversion metric
      metric_pct_change: 0.1, // 10% default effect size
    }
  ];

  return createExperimentBody.parse({
    design_spec: {
      participant_type: formData.participantType!,
      experiment_name: formData.name,
      experiment_type: 'online', // CMAB experiments use online assignment
      arms: standardArms,
      end_date: new Date(Date.parse(formData.endDate)).toISOString(),
      start_date: new Date(Date.parse(formData.startDate)).toISOString(),
      description: formData.hypothesis,
      filters: [], // CMAB doesn't use complex filtering initially
      metrics: metrics,
      strata: [],
      power: 0.8, // Default power for CMAB
      alpha: 0.05, // Default alpha for CMAB
      experiment_id: null,
      // Context variables would be included here in actual API implementation
      // context_variables: formData.contextVariables,
    },
    power_analyses: null, // CMAB doesn't use power analysis
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
  switch (formData.experimentType) {
    case 'frequent_ab':
      return [...errors, ...validateFrequentABFormData(formData)];
    case 'multi_armed_bandit':
      return [...errors, ...validateMABFormData(formData)];
    case 'bayesian_ab':
      return [...errors, ...validateBayesianABFormData(formData)];
    case 'contextual_bandit':
      return [...errors, ...validateCMABFormData(formData)];
  }

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

function validateBayesianABFormData(formData: BayesianABFormData): string[] {
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

  // Validate prior parameters (always normal for Bayesian A/B)
  formData.arms.forEach((arm, index) => {
    if (!arm.arm_name?.trim()) {
      errors.push(`Arm ${index + 1} name is required`);
    }
    
    if (arm.mean_prior === undefined) {
      errors.push(`Arm ${index + 1} Mean prior is required`);
    }
    if (!arm.stddev_prior || arm.stddev_prior <= 0) {
      errors.push(`Arm ${index + 1} Standard deviation prior must be greater than 0`);
    }
  });

  return errors;
}

function validateCMABFormData(formData: CMABFormData): string[] {
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

  // Validate context variables
  if (!formData.contextVariables || formData.contextVariables.length === 0) {
    errors.push('At least 1 context variable is required');
  }

  formData.contextVariables?.forEach((variable, index) => {
    if (!variable.name?.trim()) {
      errors.push(`Context variable ${index + 1} name is required`);
    }
    if (!variable.description?.trim()) {
      errors.push(`Context variable ${index + 1} description is required`);
    }
    if (!variable.type) {
      errors.push(`Context variable ${index + 1} type is required`);
    }
  });

  // Check for unique context variable names
  const contextNames = formData.contextVariables?.map(v => v.name.trim().toLowerCase()) || [];
  const uniqueContextNames = new Set(contextNames);
  if (contextNames.length !== uniqueContextNames.size) {
    errors.push('Context variable names must be unique');
  }

  // Validate prior parameters (always normal for CMAB)
  formData.arms.forEach((arm, index) => {
    if (!arm.arm_name?.trim()) {
      errors.push(`Arm ${index + 1} name is required`);
    }
    
    if (arm.mean_prior === undefined) {
      errors.push(`Arm ${index + 1} Mean prior is required`);
    }
    if (!arm.stddev_prior || arm.stddev_prior <= 0) {
      errors.push(`Arm ${index + 1} Standard deviation prior must be greater than 0`);
    }
  });

  return errors;
}