'use client';
import { Flex, Heading, Table } from '@radix-ui/themes';
import { RemoveUserFromOrgDialog } from '@/components/features/organizations/remove-user-from-org-dialog';
import { useAuth } from '@/providers/auth-provider';
import { AddUserDialog } from '@/components/features/organizations/add-user-dialog';

export function UsersTable({
  users,
  organizationId,
}: {
  users: { id: string; email: string }[];
  organizationId: string;
}) {
  const auth = useAuth();

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading size="4">Users</Heading>
        <AddUserDialog organizationId={organizationId} />
      </Flex>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  {auth.isAuthenticated && user.email !== auth.userEmail && (
                    <RemoveUserFromOrgDialog organizationId={organizationId} userId={user.id} />
                  )}
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}
