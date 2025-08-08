'use client';

import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { Table } from '@radix-ui/themes';

export function ParametersSummaryTable({ formData }: { formData: FrequentABFormData }) {
  return (
    <>
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
            <Table.RowHeaderCell>Desired sample size</Table.RowHeaderCell>
            <Table.Cell>{formData.chosenN || 'N/A'}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </>
  );
}
