'use client';
import { Flex, Heading, Spinner, Table, Text } from '@radix-ui/themes';
import { useGetOrganization } from '@/api/admin';
import { useSearchParams } from 'next/navigation';
import { DeleteUserDialog } from '@/app/organizationdetails/delete-user-dialog';
import { AddUserDialog } from '@/app/organizationdetails/add-user-dialog';
import { AddDatasourceDialog } from '@/app/organizationdetails/add-datasource-dialog';
import { isSuccessResponse } from '@/services/typehelper';
import { DatasourcesTable } from '@/app/organizationdetails/datasources-table';

function UsersTable({ users, organizationId }: { users: { id: string; email: string }[]; organizationId: string }) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>User ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {users.map((user) => (
          <Table.Row key={user.id}>
            <Table.Cell>{user.email}</Table.Cell>
            <Table.Cell>{user.id}</Table.Cell>
            <Table.Cell>
              <Flex gap="2">
                <DeleteUserDialog organizationId={organizationId} userId={user.id} />
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export default function Page() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('id');

  const { data, isLoading, error } = useGetOrganization(organizationId!, {
    swr: {
      enabled: organizationId !== null,
    },
  });

  if (!organizationId) {
    return <Text>Error: Missing organization ID</Text>;
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !isSuccessResponse(data)) {
    return <Text>Error: {JSON.stringify(error)}</Text>;
  }

  const organization = data?.data;

  return (
    <Flex direction="column" gap="3">
      <Heading>Settings for: {organization.name}</Heading>

      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Heading size="4">Users</Heading>
          <AddUserDialog organizationId={organizationId} />
        </Flex>
        <UsersTable users={organization.users} organizationId={organizationId} />
      </Flex>

      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Heading size="4">Datasources</Heading>
          <AddDatasourceDialog organizationId={organizationId} />
        </Flex>
        <DatasourcesTable datasources={organization.datasources} organizationId={organizationId} />
      </Flex>
    </Flex>
  );
}
