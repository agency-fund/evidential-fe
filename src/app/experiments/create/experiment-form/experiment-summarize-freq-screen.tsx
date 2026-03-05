'use client';

import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
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
  const metrics: ExperimentConfirmationDisplayProps['metrics'] = {
    primary: data.primaryMetric
      ? {
          field_name: data.primaryMetric.metric.field_name,
          data_type: data.primaryMetric.metric.data_type,
          mde: data.primaryMetric.mde,
        }
      : undefined,
    secondary: (data.secondaryMetrics ?? []).map((m) => ({
      field_name: m.metric.field_name,
      data_type: m.metric.data_type,
      mde: m.mde,
    })),
  };

  return (
    <ExperimentsSummarizeScreenBase
      data={data}
      navigatePrev={navigatePrev}
      navigateTo={navigateTo}
      onCommitError={(response) => dispatch({ type: 'set-commit-error', response })}
      infoCalloutText="Assignments will be downloadable after the experiment is saved."
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
