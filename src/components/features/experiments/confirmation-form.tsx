'use client';
import { Button, Callout, Card, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { ExperimentFormData } from '@/app/datasources/[datasourceId]/experiments/create/page';
import { useRouter } from 'next/navigation';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useAbandonExperiment, useCommitExperiment } from '@/api/admin';
import { ParametersSummaryTable } from '@/components/features/experiments/parameters-summary-table';
import { StatisticsSummaryTable } from '@/components/features/experiments/statistics-summary-table';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ApiError } from '@/services/orval-fetch';

interface ConfirmationFormProps {
  formData: ExperimentFormData;
  onBack: () => void;
  onFormDataChange: (data: ExperimentFormData) => void;
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
      <Card>
        <Heading size="4" mb="4">
          Basic Information
        </Heading>
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
              <Table.RowHeaderCell>Name</Table.RowHeaderCell>
              <Table.Cell>{formData.name}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Hypothesis</Table.RowHeaderCell>
              <Table.Cell>
                <Text style={{ whiteSpace: 'pre-wrap' }}>{formData.hypothesis}</Text>
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Participant Type</Table.RowHeaderCell>
              <Table.Cell>{formData.participantType || '-'}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Start Date</Table.RowHeaderCell>
              <Table.Cell>{formData.startDate}</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>End Date</Table.RowHeaderCell>
              <Table.Cell>{formData.endDate}</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Card>
      <Card>
        <Heading size="4" mb="4">
          Treatment Arms
        </Heading>
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
                  <Text style={{ whiteSpace: 'pre-wrap' }}>{arm.arm_description || '-'}</Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card>
      <Flex direction="row" gap="3">
        <Card>
          <Heading size="4" mb="4">
            Metrics
          </Heading>
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="1">
              <Text weight="bold">Primary Metric</Text>
              {formData.primaryMetric ? (
                <Text>
                  {formData.primaryMetric.metricName} (min effect: {formData.primaryMetric.mde}%)
                </Text>
              ) : (
                <Text>-</Text>
              )}
            </Flex>
            <Flex direction="column" gap="1">
              <Text weight="bold">Secondary Metrics</Text>
              {formData.secondaryMetrics.length > 0 ? (
                formData.secondaryMetrics.map((metric) => (
                  <Text key={metric.metricName}>
                    {metric.metricName} (min effect: {metric.mde}%)
                  </Text>
                ))
              ) : (
                <Text>None</Text>
              )}
            </Flex>
          </Flex>
        </Card>
        <Card>
          <ParametersSummaryTable formData={formData} />
        </Card>
        <Card>
          <StatisticsSummaryTable formData={formData} />
        </Card>
      </Flex>
      <Card>
        <Heading size="4" mb="4">
          Filters
        </Heading>
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
      </Card>

      <ExperimentErrorCallout error={commitError} type={'commit'} />
      <ExperimentErrorCallout error={abandonError} type={'abandon'} />

      <Flex gap="3" justify="between" align="center">
        <Callout.Root variant={'soft'} size={'1'}>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>Assignments will be downloadable after the experiment is saved.</Callout.Text>
        </Callout.Root>
        <Flex gap="3">
          <Button variant="soft" onClick={handleAbandonCommit}>
            Back
          </Button>
          <Button onClick={handleSaveCommit}>Save Experiment</Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
