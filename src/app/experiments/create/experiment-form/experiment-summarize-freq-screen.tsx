'use client';

import { useCallback, useEffect, useState } from 'react';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Button, Callout, Flex, Spinner, Text } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { createExperiment } from '@/api/admin';
import { CreateExperimentResponse } from '@/api/methods.schemas';
import { convertToDesignSpec } from './experiment-form-helpers';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import {
  ExperimentConfirmationDisplay,
  ExperimentConfirmationDisplayProps,
} from '@/components/features/experiments/experiment-confirmation-display';
import { InfoCircledIcon } from '@radix-ui/react-icons';

type CreationStatus = 'idle' | 'creating-experiment' | 'success' | 'error';

type ExperimentsSummarizeFreqScreenMessage = {
  type: 'set-experiment-response';
  response: CreateExperimentResponse;
};

function LoadingUI({ status }: { status: CreationStatus }) {
  const statusMessages: Record<CreationStatus, string> = {
    idle: 'Preparing...',
    'creating-experiment': 'Creating experiment and generating assignments...',
    success: 'Complete!',
    error: 'Error occurred',
  };

  return (
    <Flex direction="column" gap="4" align="center" justify="center" py="9">
      <Spinner size="3" />
      <Text size="3" color="gray">
        {statusMessages[status]}
      </Text>
    </Flex>
  );
}

export const ExperimentsSummarizeFreqScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsSummarizeFreqScreenMessage>) => {
  const [status, setStatus] = useState<CreationStatus>(data.createExperimentResponse ? 'success' : 'idle');
  const [error, setError] = useState<Error | null>(null);

  const runCreation = useCallback(async () => {
    if (!data.datasourceId || !data.tableName) {
      return;
    }

    setStatus('creating-experiment');
    setError(null);

    try {
      const designSpec = convertToDesignSpec(data);
      const response = await createExperiment(
        data.datasourceId,
        {
          design_spec: designSpec,
          power_analyses: data.powerCheckResponse ?? null,
          webhooks: data.selectedWebhookIds,
          table_name: data.tableName,
          primary_key: data.primaryKey,
        },
        { chosen_n: data.chosenN },
      );

      setStatus('success');
      dispatch({ type: 'set-experiment-response', response });
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (data.createExperimentResponse) {
      setStatus('success');
      return;
    }

    if (status === 'idle') {
      runCreation();
    }
  }, [status, data.createExperimentResponse, runCreation]);

  const handleRetry = () => {
    setStatus('idle');
    setError(null);
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

  const filterFieldTypes = Object.fromEntries(
    (data.availableFilterFields ?? []).map((f) => [f.field_name, f.data_type]),
  );

  return (
    <Flex direction="column" gap="3">
      <WizardBreadcrumbs />

      {status === 'error' && error && (
        <Flex direction="column" gap="3">
          <GenericErrorCallout title="Failed to create experiment" error={error} />
          <Flex justify="end">
            <Button onClick={handleRetry}>Retry</Button>
          </Flex>
        </Flex>
      )}

      {status === 'success' && data.createExperimentResponse ? (
        <>
          <ExperimentConfirmationDisplay
            response={data.createExperimentResponse}
            metrics={metrics}
            filterFieldTypes={filterFieldTypes}
            chosenN={data.chosenN}
          />
          <Callout.Root variant={'soft'} size={'1'}>
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>Assignments will be downloadable after the experiment is saved.</Callout.Text>
          </Callout.Root>
        </>
      ) : status !== 'error' ? (
        <LoadingUI status={status} />
      ) : null}
    </Flex>
  );
};
