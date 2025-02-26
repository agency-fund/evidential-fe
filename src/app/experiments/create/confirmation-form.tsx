'use client';
import { Button, Card, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { ExperimentFormData } from './page';
import { DownloadIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

interface ConfirmationFormProps {
  formData: ExperimentFormData;
  onBack: () => void;
}

export function ConfirmationForm({ formData, onBack }: ConfirmationFormProps) {
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
              <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {formData.arms.map((arm, index) => (
              <Table.Row key={index}>
                <Table.Cell>{arm.arm_name}</Table.Cell>
                <Table.Cell>{arm.arm_description || '-'}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card>
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
            <Text>{formData.secondaryMetrics.length > 0 ? formData.secondaryMetrics.join(', ') : '-'}</Text>
          </Flex>
        </Flex>
      </Card>
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
      <Card>
        <Heading size="4" mb="4">
          Parameters
        </Heading>
        <Table.Root>
          <Table.Body>
            <Table.Row>
              <Table.RowHeaderCell>Confidence</Table.RowHeaderCell>
              <Table.Cell>{formData.confidence}%</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Power</Table.RowHeaderCell>
              <Table.Cell>{formData.power}%</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.RowHeaderCell>Effect % Change</Table.RowHeaderCell>
              <Table.Cell>{formData.effectPctChange}%</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Card>
      <Flex gap="3" justify="between">
        <Button variant="soft">
          <DownloadIcon />
          Export assignments
        </Button>
        <Flex gap="3">
          <Button variant="soft" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => router.push('/experiments')}>Save Experiment</Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
