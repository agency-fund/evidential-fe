'use client';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { useListOrganizations } from '@/api/admin';
import { CreateOrganizationDialog } from '@/components/features/organizations/create-organization-dialog';
import { OrganizationsTable } from '@/components/features/organizations/organizations-table';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';

export default function Page() {
  const { data, isLoading, error } = useListOrganizations();

  if (isLoading || data === undefined) {
    return <XSpinner message="Loading organizations..." />;
  }
  if (error) {
    return <Text>Error: {JSON.stringify(error)}</Text>;
  }
  return (
    <Flex direction="column" gap="3">
      <Heading>Manage Organizations</Heading>
      <Flex justify="between" align="center">
        <Heading size="4">Organizations</Heading>
        <CreateOrganizationDialog />
      </Flex>
      {data.items.length > 0 ? (
        <OrganizationsTable organizations={data.items} />
      ) : (
        <EmptyStateCard title="No organizations found" description="Create an organization to get started">
          <CreateOrganizationDialog />
        </EmptyStateCard>
      )}
    </Flex>
  );
}
