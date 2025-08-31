'use client';
import { Flex, Table } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import Link from 'next/link';
import { DeleteDatasourceDialog } from '@/components/features/datasources/delete-datasource-dialog';
import { EditDatasourceDialog } from '@/components/features/datasources/edit-datasource-dialog';

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
          <Table.ColumnHeaderCell>Driver</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {datasources.map((datasource) => (
          <Table.Row key={datasource.id}>
            <Table.Cell>
              <Flex align="center" gap="2">
                <Link href={`/datasources/${datasource.id}`}>{datasource.name}</Link>
                <CopyToClipBoard content={datasource.id} tooltipContent="Copy Datasource ID" />
              </Flex>
            </Table.Cell>

            <Table.Cell>
              {datasource.driver === 'bigquery' && 'Google BigQuery'}
              {datasource.driver === 'postgresql+psycopg' && 'PostgreSQL'}
              {datasource.driver === 'postgresql+psycopg2' && 'Redshift'}
              {datasource.driver === 'none' && <em>no warehouse</em>}
            </Table.Cell>
            <Table.Cell>
              <Flex gap="2">
                <EditDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
                <DeleteDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
