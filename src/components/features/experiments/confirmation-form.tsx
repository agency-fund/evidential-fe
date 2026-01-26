'use client';

import { Button, Callout, Flex } from '@radix-ui/themes';
import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { useRouter } from 'next/navigation';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useAbandonExperiment, useCommitExperiment } from '@/api/admin';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ApiError } from '@/services/orval-fetch';
import {
  ExperimentConfirmationDisplay,
  ExperimentConfirmationDisplayProps,
} from '@/components/features/experiments/experiment-confirmation-display';

interface ConfirmationFormProps {
  formData: FrequentABFormData;
  onBack: () => void;
  onFormDataChange: (data: FrequentABFormData) => void;
}

function ExperimentErrorCallout({ error, type }: { error?: Error; type: 'commit' | 'abandon' }) {
  if (!error) return null;

  const title = `Failed to ${type} experiment`;
  const message = type === 'commit' ? 'Experiment already committed.' : 'Experiment already abandoned.';
  const is304 = error instanceof ApiError && error.response.status === 304;
  return <GenericErrorCallout title={title} message={is304 ? message : undefined} error={is304 ? undefined : error} />;
}

export function ConfirmationForm({ formData, onBack, onFormDataChange }: ConfirmationFormProps) {
  const { trigger: abandon, error: abandonError } = useAbandonExperiment(
    formData.datasourceId!,
    formData.experimentId!,
  );
  const { trigger: commit, error: commitError } = useCommitExperiment(formData.datasourceId!, formData.experimentId!);

  const handleSaveCommit = async () => {
    await commit();
    router.push('/experiments');
  };

  const handleAbandonCommit = async () => {
    await abandon();
    onFormDataChange({ ...formData, powerCheckResponse: undefined, experimentId: undefined });
    onBack();
  };

  const router = useRouter();

  // Adapt formData to ExperimentConfirmationDisplay props
  const metrics: ExperimentConfirmationDisplayProps['metrics'] = {
    primary: formData.primaryMetric
      ? {
          field_name: formData.primaryMetric.metric.field_name,
          data_type: formData.primaryMetric.metric.data_type,
          mde: formData.primaryMetric.mde,
        }
      : undefined,
    secondary: formData.secondaryMetrics.map((m) => ({
      field_name: m.metric.field_name,
      data_type: m.metric.data_type,
      mde: m.mde,
    })),
  };

  const filterFieldTypes = Object.fromEntries(
    (formData.availableFilterFields ?? []).map((f) => [f.field_name, f.data_type]),
  );

  const footer = (
    <>
      <ExperimentErrorCallout error={commitError} type={'commit'} />
      <ExperimentErrorCallout error={abandonError} type={'abandon'} />

      <Flex gap="3" justify="between" align="center">
        <Callout.Root variant={'soft'} size={'1'}>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>Assignments will be downloadable after the experiment is saved.</Callout.Text>
        </Callout.Root>
        <Flex gap="3" justify="end">
          <Button variant="soft" onClick={handleAbandonCommit}>
            Back
          </Button>
          <Button onClick={handleSaveCommit}>Save Experiment</Button>
        </Flex>
      </Flex>
    </>
  );

  return (
    <ExperimentConfirmationDisplay
      response={formData.createExperimentResponse!}
      metrics={metrics}
      filterFieldTypes={filterFieldTypes}
      chosenN={formData.chosenN}
      footer={footer}
    />
  );
}
