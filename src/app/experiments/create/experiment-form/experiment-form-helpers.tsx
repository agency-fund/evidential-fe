import { formatDateUtcYYYYMMDD } from '@/services/date-utils';
import { z } from 'zod';
import {
  DesignSpecInput,
  DesignSpecMetricRequest,
  OnlineFrequentistExperimentSpecInput,
  PreassignedFrequentistExperimentSpecInput,
  Stratum,
} from '@/api/methods.schemas';
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
