'use client';

import { useRouter } from 'next/navigation';
import { Callout, Flex } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useCommitExperiment } from '@/api/admin';
import { ErrorType } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import {
  ExperimentConfirmationDisplay,
  ExperimentConfirmationDisplayProps,
} from '@/components/features/experiments/experiment-confirmation-display';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';

type EditTargets = {
  metadata?: ExperimentScreenId;
  treatmentArms?: ExperimentScreenId;
  datasource?: ExperimentScreenId;
  filters?: ExperimentScreenId;
  outcomesPrior?: ExperimentScreenId;
  contexts?: ExperimentScreenId;
  metrics?: ExperimentScreenId;
  powerBalance?: ExperimentScreenId;
};

interface ExperimentsSummarizeScreenBaseProps {
  data: ExperimentFormData;
  navigatePrev: () => void;
  navigateTo: (screenId: ExperimentScreenId) => void;
  onCommitError: (response: ErrorType<unknown>) => void;
  infoCalloutText: React.ReactNode;
  editTargets: EditTargets;
  frequentistInfo?: Pick<ExperimentConfirmationDisplayProps, 'metrics' | 'chosenN'>;
}

export function ExperimentsSummarizeScreenBase({
  data,
  navigatePrev,
  navigateTo,
  onCommitError,
  infoCalloutText,
  editTargets,
  frequentistInfo,
}: ExperimentsSummarizeScreenBaseProps) {
  const router = useRouter();

  const experimentId = data.createExperimentResponse?.experiment_id ?? '';
  const datasourceId = data.datasourceId ?? '';

  const { trigger: triggerCommit, isMutating: commitLoading } = useCommitExperiment(datasourceId, experimentId, {
    swr: {
      onSuccess: () => {
        router.push('/experiments');
      },
      onError: async (response: ErrorType<unknown>) => {
        onCommitError(response);
      },
    },
  });

  const handleCommit = async () => {
    if (!datasourceId || !experimentId) return;
    try {
      await triggerCommit();
    } catch {
      // Error handled by onError callback
    }
  };

  const toEditHandler = (target?: ExperimentScreenId) => (target ? () => navigateTo(target) : undefined);

  if (data.commitError) {
    return (
      <>
        <Flex direction="column" gap="3">
          <GenericErrorCallout title="Failed to create experiment" error={data.commitError} />
        </Flex>
        <NavigationButtons onBack={navigatePrev} onNext={() => {}} nextDisabled />
      </>
    );
  }

  return (
    <>
      <Flex direction="column" gap="4">
        {data.createExperimentResponse !== undefined && (
          <>
            <ExperimentConfirmationDisplay
              response={data.createExperimentResponse}
              tableName={data.tableName}
              primaryKey={data.primaryKey}
              metrics={frequentistInfo?.metrics}
              chosenN={frequentistInfo?.chosenN}
              onEditMetadata={toEditHandler(editTargets.metadata)}
              onEditTreatmentArms={toEditHandler(editTargets.treatmentArms)}
              onEditDatasource={toEditHandler(editTargets.datasource)}
              onEditFilters={toEditHandler(editTargets.filters)}
              onEditOutcomesPrior={toEditHandler(editTargets.outcomesPrior)}
              onEditContexts={toEditHandler(editTargets.contexts)}
              onEditMetrics={toEditHandler(editTargets.metrics)}
              onEditPowerBalance={toEditHandler(editTargets.powerBalance)}
            />
            <Callout.Root>
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>{infoCalloutText}</Callout.Text>
            </Callout.Root>
          </>
        )}
      </Flex>
      <NavigationButtons
        onBack={navigatePrev} // navigatePrev will handle abandonment
        onNext={handleCommit}
        nextDisabled={!data.createExperimentResponse}
        nextLoading={commitLoading}
        nextLabel="Save Experiment"
      />
    </>
  );
}
