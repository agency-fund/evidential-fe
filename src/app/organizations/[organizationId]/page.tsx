'use client';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { RenameOrganizationDialog } from '@/components/features/organizations/rename-organization-dialog';
import { XSpinner } from '@/components/ui/x-spinner';
import { useGetOrganization, useListOrganizationEvents, useListOrganizationWebhooks } from '@/api/admin';
import { useParams } from 'next/navigation';
import { AddUserDialog } from '@/components/features/organizations/add-user-dialog';
import { AddDatasourceDialog } from '@/components/features/datasources/add-datasource-dialog';
import { AddWebhookDialog } from '@/components/features/organizations/add-webhook-dialog';
import { DatasourcesTable } from '@/components/features/datasources/datasources-table';
import { UsersTable } from '@/components/features/organizations/users-table';
import { EventsTable } from '@/components/features/organizations/events-table';
import { WebhooksTable } from '@/components/features/organizations/webhooks-table';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';

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
    <Flex direction="column" gap="3">
      <Heading>{organization.name}</Heading>
      <Flex gap={'3'}>
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
        {organization.datasources.length > 0 ? (
          <DatasourcesTable datasources={organization.datasources} organizationId={organizationId} />
        ) : (
          <EmptyStateCard title="No datasources found" description="Add a datasource to get started">
            <AddDatasourceDialog organizationId={organizationId} />
          </EmptyStateCard>
        )}
      </Flex>

      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Heading size="4">Webhooks</Heading>
          <AddWebhookDialog
            organizationId={organizationId}
            disabled={webhooksData?.items && webhooksData.items.length > 0}
          />
        </Flex>
        {isLoadingWebhooks ? (
          <XSpinner message="Loading webhooks..." />
        ) : webhooksError ? (
          <GenericErrorCallout title={'Failed to fetch webhooks'} error={webhooksError} />
        ) : webhooksData?.items && webhooksData.items.length > 0 ? (
          <WebhooksTable webhooks={webhooksData?.items || []} organizationId={organizationId} />
        ) : (
          <EmptyStateCard title="No webhooks found" description="Add a webhook to get started">
            <AddWebhookDialog organizationId={organizationId} />
          </EmptyStateCard>
        )}
      </Flex>

      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Heading size="4">Recent Events</Heading>
        </Flex>
        {isLoadingEvents ? (
          <XSpinner message="Loading events..." />
        ) : eventsError ? (
          <GenericErrorCallout title={'Failed to fetch events'} error={eventsError} />
        ) : eventsData?.items && eventsData.items.length > 0 ? (
          <EventsTable events={eventsData?.items || []} />
        ) : (
          <EmptyStateCard title="No events found" description="Events will appear here">
            <AddWebhookDialog organizationId={organizationId} />
          </EmptyStateCard>
        )}
      </Flex>
    </Flex>
  );
}
