import { Flex, Table } from '@radix-ui/themes';
import { DeleteUserDialog } from '@/app/organizationdetails/delete-user-dialog';

export const UsersTable = ({
  users,
  organizationId,
}: {
  users: { id: string; email: string }[];
  organizationId: string;
}) => (
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
              <DeleteUserDialog organizationId={organizationId} userId={user.id} />
            </Flex>
          </Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table.Root>
);
