'use client';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { RenameOrganizationDialog } from './rename-organization-dialog';
import { XSpinner } from '../components/x-spinner';
import { useGetOrganization, useListOrganizationEvents, useListOrganizationWebhooks } from '@/api/admin';
import { useSearchParams } from 'next/navigation';
import { AddUserDialog } from '@/app/organizationdetails/add-user-dialog';
import { AddDatasourceDialog } from '@/app/organizationdetails/add-datasource-dialog';
import { AddWebhookDialog } from '@/app/organizationdetails/add-webhook-dialog';
import { DatasourcesTable } from '@/app/organizationdetails/datasources-table';
import { UsersTable } from '@/app/organizationdetails/users-table';
import { EventsTable } from '@/app/organizationdetails/events-table';
import { WebhooksTable } from '@/app/organizationdetails/webhooks-table';
import { GenericErrorCallout } from '@/app/components/generic-error';

export default function Page() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get('id');

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
        <DatasourcesTable datasources={organization.datasources} organizationId={organizationId} />
      </Flex>

      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Heading size="4">Webhooks</Heading>
          <AddWebhookDialog organizationId={organizationId} />
        </Flex>
        {isLoadingWebhooks ? (
          <XSpinner message="Loading webhooks..." />
        ) : webhooksError ? (
          <GenericErrorCallout title={'Failed to fetch webhooks'} error={webhooksError} />
        ) : (
          <WebhooksTable webhooks={webhooksData?.items || []} organizationId={organizationId} />
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
        ) : (
          <EventsTable events={eventsData?.items || []} />
        )}
      </Flex>
    </Flex>
  );
}
