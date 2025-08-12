'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Flex, Table, Text, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { MABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ApiError } from '@/services/orval-fetch';
import { useAbandonExperiment, useCommitExperiment } from '@/api/admin';
import { ListSelectedWebhooksCard } from '@/components/features/experiments/list-selected-webhooks-card';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';

interface MABConfirmationFormProps {
  formData: MABFormData;
  onBack: () => void;
  onNext: () => void;
  onFormDataChange: (data: MABFormData) => void;
}

function MABExperimentErrorCallout({ error, type }: { error?: Error; type: 'commit' | 'abandon' }) {
  if (!error) return null;

  const title = `Failed to ${type} MAB experiment`;
  // Specify a message if the error is a 304 since it has no content.
  const message = type === 'commit' ? 'Experiment already committed.' : 'Experiment already abandoned.';
  const is304 = error instanceof ApiError && error.response.status === 304;
  return <GenericErrorCallout title={title} message={is304 ? message : undefined} error={is304 ? undefined : error} />;
}

export function MABConfirmationForm({ formData, onBack, onFormDataChange }: MABConfirmationFormProps) {
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
    // TODO: move these state resets to CreateExperimentPage so that all page-to-page state transitions are in one place
    onFormDataChange({ ...(formData as MABFormData), experimentId: undefined });
    onBack();
  };

  const router = useRouter();
  return (
    <Flex direction="column" gap="4">
      {/* Basic Information */}
      <SectionCard title="Basic Information">
        <Table.Root>
          <Table.Body>
            <Table.Row>
              <Table.RowHeaderCell>Experiment ID</Table.RowHeaderCell>
              <Table.Cell>
                <Flex gap="2" align="center">
                  <Text>{formData.experimentId}</Text>
                  <CopyToClipBoard content={formData.experimentId!} />
                </Flex>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Experiment Type</Table.RowHeaderCell>
              <Table.Cell>{formData.experimentType}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Name</Table.RowHeaderCell>
              <Table.Cell>{formData.name}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Hypothesis</Table.RowHeaderCell>
              <Table.Cell>
                <ReadMoreText text={formData.hypothesis} />
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Participant Type</Table.RowHeaderCell>
              <Table.Cell>{formData.participantType || '-'}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Start Date</Table.RowHeaderCell>
              <Table.Cell>{new Date(formData.startDate).toLocaleDateString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>End Date</Table.RowHeaderCell>
              <Table.Cell>{new Date(formData.endDate).toLocaleDateString()}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </SectionCard>

      {/* Configuration */}
      <SectionCard title="Configuration">
        <Table.Root>
          <Table.Body>
            <Table.Row>
              <Table.RowHeaderCell>Outcome Type</Table.RowHeaderCell>
              <Table.Cell>{formData.outcomeType === 'binary' ? 'Binary' : 'Real-valued'}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Prior Distribution</Table.RowHeaderCell>
              <Table.Cell>{formData.priorType === 'beta' ? 'Beta' : 'Normal'}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </SectionCard>

      {/* Treatment Arms */}
      <SectionCard title="Treatment Arms">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
              {formData.priorType === 'beta' ? (
                <>
                  <Table.ColumnHeaderCell>Alpha Prior</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Beta Prior</Table.ColumnHeaderCell>
                </>
              ) : (
                <>
                  <Table.ColumnHeaderCell>Mean Prior</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Std Dev Prior</Table.ColumnHeaderCell>
                </>
              )}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {formData.createExperimentResponse?.design_spec.arms.map((arm, index) => (
              <Table.Row key={index}>
                <Table.Cell>
                  <Flex gap="2" align="center">
                    <Text>{arm.arm_id}</Text>
                    <CopyToClipBoard content={arm.arm_id!} />
                  </Flex>
                </Table.Cell>
                <Table.Cell>
                  <Text weight="bold">{arm.arm_name} </Text>
                  {index === 0 && (
                    <Text size="1" color="gray">
                      (Control)
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <ReadMoreText text={arm.arm_description || '-'} />
                </Table.Cell>
                {formData.priorType === 'beta' ? (
                  <>
                    <Table.Cell>{arm.alpha_init ?? 1}</Table.Cell>
                    <Table.Cell>{arm.beta_init ?? 1}</Table.Cell>
                  </>
                ) : (
                  <>
                    <Table.Cell>{arm.mu_init ?? 0}</Table.Cell>
                    <Table.Cell>{arm.sigma_init ?? 1}</Table.Cell>
                  </>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </SectionCard>

      <ListSelectedWebhooksCard webhookIds={formData.selectedWebhookIds} />

      <MABExperimentErrorCallout error={commitError} type={'commit'} />
      <MABExperimentErrorCallout error={abandonError} type={'abandon'} />

      {/* Info about MAB */}
      <Callout.Root>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Multi-Armed Bandit experiments automatically adapt traffic allocation based on performance. No power analysis
          or sample size planning is required.
        </Callout.Text>
      </Callout.Root>

      <NavigationButtons
        onBack={handleAbandonCommit}
        onNext={handleSaveCommit}
        nextLabel="Save Experiment"
        showBack={true}
      />
    </Flex>
  );
}
