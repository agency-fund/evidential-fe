'use client';

import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { ErrorType } from '@/services/orval-fetch';
import { ExperimentConfirmationDisplayProps } from '@/components/features/experiments/experiment-confirmation-display';
import { ExperimentsSummarizeScreenBase } from '@/app/experiments/create/experiment-form/experiment-summarize-screen-base';

type ExperimentsSummarizeFreqScreenMessage = { type: 'set-commit-error'; response: ErrorType<unknown> };

export const ExperimentsSummarizeFreqScreen = ({
  data,
  navigatePrev,
  navigateTo,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsSummarizeFreqScreenMessage, ExperimentScreenId>) => {
  const isFreqPreassigned = data.experimentType === 'freq_preassigned';

  const estimatedMdeByField = new Map(
    (data.mdePowerCheckResponse?.analyses ?? []).map((a) => [a.metric_spec.field_name, a.pct_change_with_desired_n]),
  );
  const estimatedMdeFor = (fieldName: string): string | null => {
    const raw = estimatedMdeByField.get(fieldName);
    return raw != null ? (raw * 100).toFixed(1) : null;
  };

  const metrics: ExperimentConfirmationDisplayProps['metrics'] = {
    primary: data.primaryMetric
      ? {
          field_name: data.primaryMetric.metric.field_name,
          data_type: data.primaryMetric.metric.data_type,
          mde: data.primaryMetric.mde,
          estimatedMde: estimatedMdeFor(data.primaryMetric.metric.field_name),
        }
      : undefined,
    secondary: (data.secondaryMetrics ?? []).map((m) => ({
      field_name: m.metric.field_name,
      data_type: m.metric.data_type,
      mde: m.mde,
      estimatedMde: estimatedMdeFor(m.metric.field_name),
    })),
  };

  return (
    <ExperimentsSummarizeScreenBase
      data={data}
      navigatePrev={navigatePrev}
      navigateTo={navigateTo}
      onCommitError={(response) => dispatch({ type: 'set-commit-error', response })}
      infoCalloutText={
        isFreqPreassigned
          ? 'Assignments will be downloadable after the experiment is saved.'
          : 'For online A/B testing, assignments are generated on the fly as users enter the experiment. No power analysis or sample size planning is required.'
      }
      editTargets={{
        metadata: 'metadata',
        treatmentArms: 'describe-arms',
        datasource: 'freq-select-datasource',
        filters: 'freq-stack',
        metrics: 'freq-stack',
        powerBalance: 'freq-stack',
      }}
      frequentistInfo={{ metrics, desiredN: data.desiredN }}
    />
  );
};
