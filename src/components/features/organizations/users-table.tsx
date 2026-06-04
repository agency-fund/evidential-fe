'use client';
import { Flex, Heading, Table, Text } from '@radix-ui/themes';
import { CheckIcon } from '@radix-ui/react-icons';
import { RemoveUserFromOrgDialog } from '@/components/features/users/remove-user-from-org-dialog';
import { useAuth } from '@/providers/auth-provider';
import { AddUserToOrgDialog } from '@/components/features/organizations/add-user-to-org-dialog';
import { UserSummary } from '@/api/methods.schemas';

interface UsersTableProps {
  users: UserSummary[];
  organizationId: string;
  organizationName: string;
}

export function UsersTable({ users, organizationId, organizationName }: UsersTableProps) {
  const auth = useAuth();
  const showPrivilegedColumn = auth.isAuthenticated && auth.isPrivileged;

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading size="4">Users</Heading>
        <AddUserToOrgDialog organizationId={organizationId} />
      </Flex>

      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
            {showPrivilegedColumn && <Table.ColumnHeaderCell justify="center">Privileged</Table.ColumnHeaderCell>}
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map((user) => (
            <Table.Row key={user.id}>
              <Table.Cell>{user.email}</Table.Cell>
              {showPrivilegedColumn && (
                <Table.Cell justify="center">
                  {user.is_privileged ? <CheckIcon aria-label="Yes" /> : <Text color="gray">—</Text>}
                </Table.Cell>
              )}
              <Table.Cell>
                <Flex gap="2">
                  {auth.isAuthenticated && user.email !== auth.userEmail && (
                    <RemoveUserFromOrgDialog
                      organizationId={organizationId}
                      organizationName={organizationName}
                      userId={user.id}
                      userEmail={user.email}
                    />
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
