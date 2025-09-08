'use client';
import { Button, Callout, Flex, Grid, Table, Text, Badge } from '@radix-ui/themes';
import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { useRouter } from 'next/navigation';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useAbandonExperiment, useCommitExperiment } from '@/api/admin';
import { ParametersSummaryTable } from '@/components/features/experiments/parameters-summary-table';
import { StatisticsSummaryTable } from '@/components/features/experiments/statistics-summary-table';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ApiError } from '@/services/orval-fetch';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { ListSelectedWebhooksCard } from '@/components/features/experiments/list-selected-webhooks-card';
import { MdeBadge } from '@/components/features/experiments/mde-badge';

interface ConfirmationFormProps {
  formData: FrequentABFormData;
  onBack: () => void;
  onFormDataChange: (data: FrequentABFormData) => void;
}

function ExperimentErrorCallout({ error, type }: { error?: Error; type: 'commit' | 'abandon' }) {
  // Local component for error display. Should not normally show.
  if (!error) return null;

  const title = `Failed to ${type} experiment`;
  // Specify a message if the error is a 304 since it has no content.
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
    // TODO: move these state resets to CreateExperimentPage so that all page-to-page state transitions are in one place
    onFormDataChange({ ...formData, powerCheckResponse: undefined, experimentId: undefined });
    onBack();
  };

  const router = useRouter();
  return (
    <Flex direction="column" gap="4">
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
      <SectionCard title="Treatment Arms">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
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
                <Table.Cell>{arm.arm_name}</Table.Cell>
                <Table.Cell>
                  <ReadMoreText text={arm.arm_description || '-'} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </SectionCard>
      <Grid columns="3" gap="3">
        <SectionCard title="Metrics">
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Text weight="bold">Primary Metric</Text>
              {formData.primaryMetric ? (
                <Flex align="center" gap="2" wrap="wrap">
                  <Text>{formData.primaryMetric.metricName}</Text>
                  <MdeBadge value={formData.primaryMetric.mde} size="1" />
                </Flex>
              ) : (
                <Text>-</Text>
              )}
            </Flex>
            <Flex direction="column" gap="1">
              <Text weight="bold">Secondary Metrics</Text>
              {formData.secondaryMetrics.length > 0 ? (
                formData.secondaryMetrics.map((metric) => (
                  <Flex key={metric.metricName} align="center" gap="2" wrap="wrap">
                    <Text>{metric.metricName}</Text>
                    <MdeBadge value={metric.mde} size="1" />
                  </Flex>
                ))
              ) : (
                <Text>None</Text>
              )}
            </Flex>
          </Flex>
        </SectionCard>
        <SectionCard title="Parameters">
          <ParametersSummaryTable formData={formData} />
        </SectionCard>
        <SectionCard title="Statistics">
          <StatisticsSummaryTable formData={formData} />
        </SectionCard>
      </Grid>
      <SectionCard title="Filters">
        {formData.filters.length > 0 ? (
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Field</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Operator</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Values</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {formData.filters.map((filter, index) => (
                <Table.Row key={index}>
                  <Table.Cell>{filter.field_name}</Table.Cell>
                  <Table.Cell>{filter.relation}</Table.Cell>
                  <Table.Cell>{filter.value.map((v) => (v === null ? '(null)' : v)).join(', ')}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        ) : (
          <Text color="gray">No filters defined</Text>
        )}
      </SectionCard>
      {formData.strata.length > 0 ? (
        <SectionCard title="Strata">
          <Flex gap="2" wrap="wrap">
            {formData.strata.map((stratum, index) => (
              <Badge key={index} variant="outline" color="gray">
                <Text size="2">{stratum.fieldName}</Text>
              </Badge>
            ))}
          </Flex>
        </SectionCard>
      ) : null}

      <ListSelectedWebhooksCard webhookIds={formData.selectedWebhookIds} />

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
    </Flex>
  );
}
