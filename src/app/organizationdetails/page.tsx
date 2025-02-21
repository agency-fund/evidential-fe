'use client';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { RenameOrganizationDialog } from './rename-organization-dialog';
import { XSpinner } from '../components/x-spinner';
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
    return <XSpinner message="Loading organization details..." />;
  }

  if (error || !isHttpOk(data)) {
    return <Text>Error: {JSON.stringify(error)}</Text>;
  }

  const organization = data?.data;

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading>{organization.name}</Heading>
        <RenameOrganizationDialog organizationId={organizationId} currentName={organization.name} />
      </Flex>

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
