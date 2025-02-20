import { OrganizationSummary } from '@/api/methods.schemas';
import { Flex, Table } from '@radix-ui/themes';
import Link from 'next/link';
import { AddUserDialog } from '@/app/organizationdetails/add-user-dialog';
import { AddDatasourceDialog } from '@/app/organizationdetails/add-datasource-dialog';

export function OrganizationsTable({ organizations }: { organizations: OrganizationSummary[] }) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Organization ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {organizations.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>
              <Link href={`/organizationdetails?id=${item.id}`}>{item.name}</Link>
            </Table.Cell>
            <Table.Cell>{item.id}</Table.Cell>
            <Table.Cell>
              <Flex gap="2">
                <AddUserDialog organizationId={item.id} />
                <AddDatasourceDialog organizationId={item.id} />
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
