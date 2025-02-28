import { ExperimentFormData } from '@/app/experiments/create/page';
import { CreateExperimentRequest, DesignSpecMetricRequest } from '@/api/methods.schemas';

export const convertFormDataToCreateExperimentRequest = (formData: ExperimentFormData): CreateExperimentRequest => {
  return {
    design_spec: {
      experiment_name: formData.name,
      arms: Array.from(formData.arms.map((arm) => ({ ...arm, arm_id: null }))),
      end_date: formData.endDate,
      start_date: formData.startDate,
      description: formData.hypothesis,
      metrics: [formData.primaryMetric!, ...formData.secondaryMetrics].map(
        (field_name): DesignSpecMetricRequest => ({
          field_name: field_name,
          metric_pct_change: Number(formData.effectPctChange) / 100.0, // TODO: populate with effect % change
        }),
      ),
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
  };
};
