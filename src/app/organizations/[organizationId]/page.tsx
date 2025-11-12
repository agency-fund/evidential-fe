'use client';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { RenameOrganizationDialog } from '@/components/features/organizations/rename-organization-dialog';
import { XSpinner } from '@/components/ui/x-spinner';
import { useGetOrganization, useListOrganizationEvents, useListOrganizationWebhooks } from '@/api/admin';
import { useParams } from 'next/navigation';
import { AddUserDialog } from '@/components/features/organizations/add-user-dialog';
import { AddDatasourceDialog } from '@/components/features/datasources/add-datasource-dialog';
import { DatasourcesTable } from '@/components/features/datasources/datasources-table';
import { UsersTable } from '@/components/features/organizations/users-table';
import { EventsTable } from '@/components/features/organizations/events-table';
import { WebhooksTable } from '@/components/features/organizations/webhooks-table';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';

const WEBHOOK_LIMIT = 10;

export default function Page() {
  const params = useParams();
  const organizationId = params.organizationId as string;

  const {
    data: organization,
    isLoading,
    error,
  } = useGetOrganization(organizationId!, {
    swr: {
      enabled: organizationId !== null,
    },
  });

  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    error: eventsError,
  } = useListOrganizationEvents(organizationId!, {
    swr: {
      enabled: organizationId !== null,
    },
  });

  const {
    data: webhooksData,
    isLoading: isLoadingWebhooks,
    error: webhooksError,
  } = useListOrganizationWebhooks(organizationId!, {
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

  if (error || !(organization !== undefined)) {
    return <GenericErrorCallout title={'Failed to fetch organizations'} error={error} />;
  }

  return (
    <Flex direction="column" gap="6">
      <Flex justify="between" align="end" width="100%">
        <Flex direction="row" align="center" gap="2">
          <Heading size="8">{organization.name}</Heading>
          <CopyToClipBoard content={organizationId} />
        </Flex>
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
        {organization.datasources.length > 0 && (
          <DatasourcesTable datasources={organization.datasources} organizationId={organizationId} />
        )}
        {(organization.datasources.length === 0 ||
          (organization.datasources.length === 1 && organization.datasources[0].driver === 'none')) && (
          <EmptyStateCard title="No data warehouse found" description="Add a new datasource to get started">
            <AddDatasourceDialog organizationId={organizationId} />
          </EmptyStateCard>
        )}
      </Flex>

      <WebhooksTable
        webhooks={webhooksData?.items || []}
        organizationId={organizationId}
        isLoading={isLoadingWebhooks}
        error={webhooksError}
        webhookCount={webhooksData?.items.length || 0}
        webhookLimit={WEBHOOK_LIMIT}
      />
      <EventsTable events={eventsData?.items || []} isLoading={isLoadingEvents} error={eventsError} />
    </Flex>
  );
}
