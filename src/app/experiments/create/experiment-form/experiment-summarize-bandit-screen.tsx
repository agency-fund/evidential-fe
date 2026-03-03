'use client';

import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { ErrorType } from '@/services/orval-fetch';
import { ExperimentsSummarizeScreenBase } from '@/app/experiments/create/experiment-form/experiment-summarize-screen-base';

export type ExperimentsSummarizeBanditMessage = { type: 'set-commit-error'; response: ErrorType<unknown> };

export const ExperimentsSummarizeBanditScreen = ({
  data,
  navigatePrev,
  navigateTo,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsSummarizeBanditMessage, ExperimentScreenId>) => {
  const isCmab = data.experimentType === 'cmab_online';

  return (
    <ExperimentsSummarizeScreenBase
      data={data}
      navigatePrev={navigatePrev}
      navigateTo={navigateTo}
      onCommitError={(response) => dispatch({ type: 'set-commit-error', response })}
      infoCalloutText={
        isCmab
          ? 'Contextual Multi-Armed Bandit experiments use context variables to make personalized arm assignments. Traffic allocation adapts based on performance within each context.'
          : 'Multi-Armed Bandit experiments automatically adapt traffic allocation based on performance. No power analysis or sample size planning is required.'
      }
      editTargets={{
        metadata: 'metadata',
        treatmentArms: 'describe-bandit-arms',
        outcomesPrior: 'bandit-binary-or-real',
        contexts: isCmab ? 'describe-contexts' : undefined,
      }}
    />
  );
};
