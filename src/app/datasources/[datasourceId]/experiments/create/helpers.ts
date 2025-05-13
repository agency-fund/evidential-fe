import { ExperimentFormData } from '@/app/datasources/[datasourceId]/experiments/create/page';
import { CreateExperimentRequest, DesignSpecMetricRequest } from '@/api/methods.schemas';
import { createExperimentBody } from '@/api/admin.zod';

import { z } from 'zod';

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
      experiment_name: formData.name,
      experiment_type: formData.experimentType,
      arms: Array.from(formData.arms.map((arm) => ({ ...arm, arm_id: null }))),
      end_date: new Date(Date.parse(formData.endDate)).toISOString(),
      start_date: new Date(Date.parse(formData.startDate)).toISOString(),
      description: formData.hypothesis,
      metrics: metrics,
      strata_field_names: [],
      power: Number(formData.power) / 100.0,
      alpha: 1 - Number(formData.confidence) / 100.0,
      experiment_id: null,
    },
    audience_spec: {
      participant_type: formData.participantType!,
      filters: formData.filters,
    },
    power_analyses: formData.powerCheckResponse,
  });
};
