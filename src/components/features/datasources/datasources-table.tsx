'use client';
import { Flex, Heading, Table } from '@radix-ui/themes';
import DatasourceRow from '@/components/features/datasources/datasources-table-row';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { AddDatasourceDialog } from '@/components/features/datasources/add-datasource-dialog';

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
  const isEmpty = datasources.length === 0 || (datasources.length === 1 && datasources[0].driver === 'none');

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading size="4">Datasources</Heading>
        <AddDatasourceDialog organizationId={organizationId} />
      </Flex>

      {isEmpty ? (
        <EmptyStateCard title="No data warehouse found" description="Add a new datasource to get started">
          <AddDatasourceDialog organizationId={organizationId} />
        </EmptyStateCard>
      ) : (
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
      )}
    </Flex>
  );
}
