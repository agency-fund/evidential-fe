'use client';

import { useRouter } from 'next/navigation';
import { Callout, Flex } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useCommitExperiment, useInspectTableInDatasource } from '@/api/admin';
import { ErrorType } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import {
  ExperimentConfirmationDisplay,
  ExperimentConfirmationDisplayProps,
} from '@/components/features/experiments/experiment-confirmation-display';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-types';

// The "Edit" buttons on the confirmation screen are temporarily disabled pending further UX effort.
const FEATURE_EDIT_BUTTONS_ENABLED = false;

type EditTargets = {
  metadata?: ExperimentScreenId;
  treatmentArms?: ExperimentScreenId;
  datasource?: ExperimentScreenId;
  filters?: ExperimentScreenId;
  outcomesPrior?: ExperimentScreenId;
  contexts?: ExperimentScreenId;
  metrics?: ExperimentScreenId;
};

interface ExperimentsSummarizeScreenBaseProps {
  data: ExperimentFormData;
  navigatePrev: () => void;
  navigateTo: (screenId: ExperimentScreenId) => void;
  onCommitError: (response: ErrorType<unknown>) => void;
  infoCalloutText: React.ReactNode;
  editTargets: EditTargets;
  frequentistInfo?: Pick<ExperimentConfirmationDisplayProps, 'metrics'>;
  openExperimentOnSave?: boolean;
}

export function ExperimentsSummarizeScreenBase({
  data,
  navigatePrev,
  navigateTo,
  onCommitError,
  infoCalloutText,
  editTargets,
  frequentistInfo,
  openExperimentOnSave = false,
}: ExperimentsSummarizeScreenBaseProps) {
  const router = useRouter();

  const experimentId = data.createExperimentResponse?.experiment_id ?? '';
  const datasourceId = data.datasourceId ?? '';

  const { data: tableMetadata } = useInspectTableInDatasource(datasourceId, data.tableName ?? '', undefined, {
    swr: { enabled: !!datasourceId && !!data.tableName },
  });
  const { trigger: triggerCommit, isMutating: commitLoading } = useCommitExperiment(datasourceId, experimentId, {
    swr: {
      onSuccess: () => {
        router.push(openExperimentOnSave ? `/datasources/${datasourceId}/experiments/${experimentId}` : '/experiments');
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

  const toEditHandler = FEATURE_EDIT_BUTTONS_ENABLED
    ? (target?: ExperimentScreenId) => (target ? () => navigateTo(target) : undefined)
    : () => undefined;

  if (data.commitError) {
    return (
      <>
        <Flex direction="column" gap="3">
          <GenericErrorCallout title="Failed to create experiment" error={data.commitError} />
        </Flex>
        <NavigationButtons onPrev={navigatePrev} onNext={() => {}} nextDisabled />
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
              tableDisplayName={tableMetadata?.display_name ?? undefined}
              metrics={frequentistInfo?.metrics}
              onEditMetadata={toEditHandler(editTargets.metadata)}
              onEditTreatmentArms={toEditHandler(editTargets.treatmentArms)}
              onEditDatasource={toEditHandler(editTargets.datasource)}
              onEditFilters={toEditHandler(editTargets.filters)}
              onEditOutcomesPrior={toEditHandler(editTargets.outcomesPrior)}
              onEditContexts={toEditHandler(editTargets.contexts)}
              onEditMetrics={toEditHandler(editTargets.metrics)}
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
        onPrev={navigatePrev} // navigatePrev will handle abandonment
        onNext={handleCommit}
        nextDisabled={!data.createExperimentResponse}
        nextLoading={commitLoading}
        nextLabel="Save Experiment"
      />
    </>
  );
}
