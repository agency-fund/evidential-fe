import { Code, Flex, IconButton, Table } from '@radix-ui/themes';
import { CopyIcon } from '@radix-ui/react-icons';
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
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {datasources.map((datasource) => (
          <Table.Row key={datasource.id}>
            <Table.Cell>
              <Link href={`/datasourcedetails?id=${datasource.id}`}>{datasource.name}</Link>
            </Table.Cell>
            <Table.Cell>
              <Flex align="center" gap="2">
                <Code variant={'ghost'}>{datasource.id}</Code>
                <IconButton size="1" aria-label="Copy value" color="gray" variant="ghost">
                  <CopyIcon onClick={() => navigator.clipboard.writeText(datasource.id)} />
                </IconButton>
              </Flex>
            </Table.Cell>
            <Table.Cell>
              {datasource.driver === 'bigquery' ? 'Google BigQuery' :
               datasource.driver === 'postgresql+psycopg' ? 'PostgreSQL' :
               datasource.driver}
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
