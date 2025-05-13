'use client';
import { Flex, Table } from '@radix-ui/themes';
import { DeleteUserDialog } from '@/components/features/organizations/delete-user-dialog';
import { useAuth } from '@/providers/auth-provider';

export function UsersTable({
  users,
  organizationId,
}: {
  users: { id: string; email: string }[];
  organizationId: string;
}) {
  const auth = useAuth();
  return (
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
                  <DeleteUserDialog organizationId={organizationId} userId={user.id} />
                )}
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
