'use client';

import { useRouter } from 'next/navigation';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Callout, Flex } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useAbandonExperiment, useCommitExperiment } from '@/api/admin';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { ExperimentConfirmationDisplay } from '@/components/features/experiments/experiment-confirmation-display';
import { ErrorType } from '@/services/orval-fetch';

export type ExperimentsSummarizeBanditMessage = { type: 'set-commit-error'; response: ErrorType<unknown> };

export const ExperimentsSummarizeBanditScreen = ({
  data,
  navigatePrev,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsSummarizeBanditMessage>) => {
  const router = useRouter();

  const experimentId = data.createExperimentResponse?.experiment_id ?? '';
  const datasourceId = data.datasourceId ?? '';

  const { trigger: triggerCommit, isMutating: commitLoading } = useCommitExperiment(datasourceId, experimentId, {
    swr: {
      onSuccess: () => {
        router.push('/experiments');
      },
      onError: async (response: ErrorType<unknown>) => {
        dispatch({ type: 'set-commit-error', response });
      },
    },
  });

  const { trigger: triggerAbandon } = useAbandonExperiment(datasourceId, experimentId);

  const handleCommit = async () => {
    if (!datasourceId || !experimentId) return;
    try {
      await triggerCommit();
    } catch {
      // Error handled by onError callback
    }
  };

  const handleAbandon = async () => {
    if (!datasourceId || !experimentId) return;
    try {
      await triggerAbandon();
    } catch {
      // Error handled by callback
    }
    navigatePrev();
  };

  const isCmab = data.experimentType === 'cmab_online';

  if (data.commitError) {
    return (
      <>
        <Flex direction="column" gap="3">
          <WizardBreadcrumbs />
          <GenericErrorCallout title="Failed to create experiment" error={data.createExperimentError} />
        </Flex>
        <NavigationButtons onBack={navigatePrev} onNext={() => {}} nextDisabled />
      </>
    );
  }

  return (
    <>
      <Flex direction="column" gap="4">
        <WizardBreadcrumbs />

        {data.createExperimentResponse !== undefined && (
          <>
            <ExperimentConfirmationDisplay
              response={data.createExperimentResponse}
              tableName={data.tableName}
              primaryKey={data.primaryKey}
            />

            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                {isCmab
                  ? 'Contextual Multi-Armed Bandit experiments use context variables to make personalized arm assignments. Traffic allocation adapts based on performance within each context.'
                  : 'Multi-Armed Bandit experiments automatically adapt traffic allocation based on performance. No power analysis or sample size planning is required.'}
              </Callout.Text>
            </Callout.Root>
          </>
        )}
      </Flex>
      <NavigationButtons
        onBack={handleAbandon}
        onNext={handleCommit}
        nextDisabled={!data.createExperimentResponse}
        nextLoading={commitLoading}
        nextLabel="Save Experiment"
        showBack
      />
    </>
  );
};
