'use client';
import { Button, Callout, Card, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { ExperimentFormData } from './page';
import { useRouter } from 'next/navigation';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useAbandonExperiment, useCommitExperiment } from '@/api/admin';
import { ParametersSummaryTable } from '@/app/experiments/create/parameters-summary-table';
import { StatisticsSummaryTable } from '@/app/experiments/create/statistics-summary-table';
import { CopyToClipBoard } from '@/app/components/buttons/copy-to-clipboard';

interface ConfirmationFormProps {
  formData: ExperimentFormData;
  onBack: () => void;
  onFormDataChange: (data: ExperimentFormData) => void;
}

export function ConfirmationForm({ formData, onBack, onFormDataChange }: ConfirmationFormProps) {
  const { trigger: abandon } = useAbandonExperiment(formData.datasourceId!, formData.experimentId!);
  const { trigger: commit } = useCommitExperiment(formData.datasourceId!, formData.experimentId!);

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
              <Table.Cell>{formData.hypothesis}</Table.Cell>
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
                <Table.Cell>{arm.arm_description || '-'}</Table.Cell>
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
              <Text>{formData.primaryMetric || '-'}</Text>
            </Flex>
            <Flex direction="column" gap="1">
              <Text weight="bold">Secondary Metrics</Text>
              <Text>{formData.secondaryMetrics.length > 0 ? formData.secondaryMetrics.join(', ') : 'None'}</Text>
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
      <Flex direction={'row'} gap={'3'}></Flex>
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
