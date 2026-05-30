'use client';
import { Flex, Heading } from '@radix-ui/themes';
import { UsersManagementTable } from '@/components/features/users/users-management-table';
import { AddUserDialog } from '@/components/features/users/add-user-dialog';
import RequirePrivileged from '@/components/require-privileged';

export default function Page() {
  return (
    <RequirePrivileged>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Heading size="8">Manage Users</Heading>
          <AddUserDialog />
        </Flex>
        <UsersManagementTable />
      </Flex>
    </RequirePrivileged>
  );
}
