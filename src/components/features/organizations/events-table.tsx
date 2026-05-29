'use client';
import { Flex, Heading, Table } from '@radix-ui/themes';
import { useListOrganizationEvents } from '@/api/admin';
import { usePagination } from '@/providers/use-pagination';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { PaginationButtons } from '@/components/ui/pagination/pagination-buttons';
import { EventRow } from '@/components/features/organizations/event-row';

interface EventsTableProps {
  organizationId?: string;
}

const getEventsTableKey = ({ organizationId }: EventsTableProps): string => organizationId ?? '';

function EventsTableImpl({ organizationId }: EventsTableProps) {
  const pagination = usePagination();

  const {
    data: eventsData,
    isLoading,
    error,
  } = useListOrganizationEvents(
    organizationId ?? '',
    { page_size: pagination.pageSize, page_token: pagination.currentPageToken },
    {
      swr: {
        keepPreviousData: true,
        enabled: !!organizationId,
        refreshInterval: 15000,
      },
    },
  );

  const events = eventsData?.items || [];
  const nextPageToken = eventsData?.next_page_token || '';

  if (!organizationId) {
    return (
      <Flex direction="column" gap="3">
        <Heading size="4">Recent Events</Heading>
        <EmptyStateCard title="No events found" description="Missing organization ID" />
      </Flex>
    );
  }

  if (isLoading && eventsData === undefined) {
    return (
      <Flex direction="column" gap="3">
        <Heading size="4">Recent Events</Heading>
        <XSpinner message="Loading events..." />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex direction="column" gap="3">
        <Heading size="4">Recent Events</Heading>
        <GenericErrorCallout title="Failed to fetch events" error={error as Error} />
      </Flex>
    );
  }

  if (events.length === 0) {
    return (
      <Flex direction="column" gap="3">
        <Heading size="4">Recent Events</Heading>
        <EmptyStateCard title="No events found" description="Events will appear here" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="3">
      <Heading size="4">Recent Events</Heading>
      <Flex direction="column" gap="2">
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Event Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created At</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Summary</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {events.map((event) => (
              <EventRow key={event.id} event={event} organizationId={organizationId} />
            ))}
          </Table.Body>
        </Table.Root>

        <Flex justify="end" gap="2">
          <PaginationButtons pagination={pagination} isLoading={isLoading} nextPageToken={nextPageToken} />
        </Flex>
      </Flex>
    </Flex>
  );
}

export function EventsTable(props: EventsTableProps) {
  return <EventsTableImpl key={getEventsTableKey(props)} {...props} />;
}
