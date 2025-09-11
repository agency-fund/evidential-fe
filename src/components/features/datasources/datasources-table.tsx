'use client';
import { Table } from '@radix-ui/themes';
import DatasourceRow from '@/components/features/datasources/datasources-table-row';

export function DatasourcesTable({
  datasources,
  organizationId,
}: {
  datasources: {
    id: string;
    name: string;
    driver: string;
  }[];
  organizationId: string;
}) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Participant Types</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Driver</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {datasources.map((datasource) => (
          <DatasourceRow key={datasource.id} datasource={datasource} organizationId={organizationId} />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
