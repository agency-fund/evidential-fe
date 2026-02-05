'use client';

import { useRouter } from 'next/navigation';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Callout, Flex } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import {
  ExperimentConfirmationDisplay,
  ExperimentConfirmationDisplayProps,
} from '@/components/features/experiments/experiment-confirmation-display';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useAbandonExperiment, useCommitExperiment } from '@/api/admin';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { ErrorType } from '@/services/orval-fetch';

type ExperimentsSummarizeFreqScreenMessage = { type: 'set-commit-error'; response: ErrorType<unknown> };

export const ExperimentsSummarizeFreqScreen = ({
  data,
  navigatePrev,
  navigateTo,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsSummarizeFreqScreenMessage, ExperimentScreenId>) => {
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
    if (!datasourceId || !experimentId) {
      return;
    }
    try {
      await triggerCommit();
    } catch {
      // Error handled by onError callback
    }
  };

  const doAbandon = async () => {
    if (datasourceId && experimentId) {
      try {
        await triggerAbandon();
      } catch {
        // Error handled by callback
      }
    }
  };

  const handleAbandon = async () => {
    await doAbandon();
    navigatePrev();
  };

  const handleEdit = async (screenId: ExperimentScreenId) => {
    await doAbandon();
    navigateTo(screenId);
  };

  const handleBreadcrumbNavigateAway = async () => {
    await doAbandon();
    return true;
  };

  // Prepare props for ExperimentConfirmationDisplay
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

  if (data.commitError) {
    return (
      <>
        <Flex direction="column" gap="3">
          <WizardBreadcrumbs onNavigateAway={handleBreadcrumbNavigateAway} />
          <GenericErrorCallout title="Failed to create experiment" error={data.createExperimentError} />
        </Flex>
        <NavigationButtons onBack={navigatePrev} onNext={() => {}} nextDisabled />
      </>
    );
  }

  return (
    <>
      <Flex direction="column" gap="4">
        <WizardBreadcrumbs onNavigateAway={handleBreadcrumbNavigateAway} />

        {data.createExperimentResponse !== undefined && (
          <>
            <ExperimentConfirmationDisplay
              response={data.createExperimentResponse}
              tableName={data.tableName}
              primaryKey={data.primaryKey}
              metrics={metrics}
              chosenN={data.chosenN}
              onEditMetadata={() => handleEdit('metadata')}
              onEditTreatmentArms={() => handleEdit('describe-arms')}
              onEditDatasource={() => handleEdit('freq-select-datasource')}
              onEditFilters={() => handleEdit('freq-stack')}
              onEditMetrics={() => handleEdit('freq-stack')}
              onEditPowerBalance={() => handleEdit('freq-stack')}
            />
            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>Assignments will be downloadable after the experiment is saved.</Callout.Text>
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
