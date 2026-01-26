'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Wizard } from '../../../services/wizard/Wizard';
import { ExperimentForm, ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { commitExperiment } from '@/api/admin';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { Flex } from '@radix-ui/themes';

export default function DefinerPage() {
  const router = useRouter();
  const [commitError, setCommitError] = useState<Error | null>(null);

  const handleSubmit = async (data: ExperimentFormData) => {
    if (!data.datasourceId || !data.createExperimentResponse?.experiment_id) {
      console.error('Missing datasourceId or experimentId for commit');
      return;
    }

    try {
      setCommitError(null);
      await commitExperiment(data.datasourceId, data.createExperimentResponse.experiment_id);
      router.push('/experiments');
    } catch (err) {
      setCommitError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  return (
    <Flex direction="column" gap="3">
      {commitError && <GenericErrorCallout title="Failed to commit experiment" error={commitError} />}
      <Wizard form={ExperimentForm} onSubmit={handleSubmit} debug={true} />
    </Flex>
  );
}
