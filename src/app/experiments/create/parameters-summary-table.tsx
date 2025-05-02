import { ExperimentFormData } from '@/app/experiments/create/page';
import { Heading, Table } from '@radix-ui/themes';

export function ParametersSummaryTable({ formData }: { formData: ExperimentFormData }) {
  return (
    <>
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
          <Table.Row>
            <Table.RowHeaderCell>Desired sample size</Table.RowHeaderCell>
            <Table.Cell>{formData.chosenN || 'N/A'}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </>
  );
}
