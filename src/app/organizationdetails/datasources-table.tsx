import { Flex, Table } from '@radix-ui/themes';
import Link from 'next/link';
import { DeleteDatasourceDialog } from '@/app/organizationdetails/delete-datasource-dialog';
import { EditDatasourceDialog } from '@/app/organizationdetails/edit-datasource-dialog';

export function DatasourcesTable({
  datasources,
  organizationId,
}: {
  datasources: {
    id: string;
    name: string;
    driver: string;
    type: string;
  }[];
  organizationId: string;
}) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Datasource ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Driver</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {datasources.map((datasource) => (
          <Table.Row key={datasource.id}>
            <Table.Cell>
              <Link href={`/datasourcedetails?id=${datasource.id}`}>{datasource.name}</Link>
            </Table.Cell>
            <Table.Cell>{datasource.id}</Table.Cell>
            <Table.Cell>{datasource.driver}</Table.Cell>
            <Table.Cell>{datasource.type}</Table.Cell>
            <Table.Cell>
              <Flex gap="2">
                <DeleteDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
                <EditDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
