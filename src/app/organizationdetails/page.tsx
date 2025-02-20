'use client';
import { Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { useGetOrganization } from '@/api/admin';
import { useSearchParams } from 'next/navigation';
import { AddUserDialog } from '@/app/organizationdetails/add-user-dialog';
import { AddDatasourceDialog } from '@/app/organizationdetails/add-datasource-dialog';
import { isHttpOk } from '@/services/typehelper';
import { DatasourcesTable } from '@/app/organizationdetails/datasources-table';
import { UsersTable } from '@/app/organizationdetails/users-table';

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

  if (error || !isHttpOk(data)) {
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
