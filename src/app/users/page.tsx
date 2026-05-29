'use client';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { useAuth } from '@/providers/auth-provider';
import { UsersManagementTable } from '@/components/features/users/users-management-table';
import { AddUserDialog } from '@/components/features/users/add-user-dialog';

export default function Page() {
  const auth = useAuth();
  if (!auth.isAuthenticated || !auth.isPrivileged) {
    return <Text>Access denied. Only privileged users can manage users.</Text>;
  }

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading size="8">Manage Users</Heading>
        <AddUserDialog />
      </Flex>
      <UsersManagementTable />
    </Flex>
  );
}
