'use client';
import { DataList, Flex, Heading, HoverCard, Table } from '@radix-ui/themes';
import { useListOrganizationEvents } from '@/api/admin';
import { EventSummary } from '@/api/methods.schemas';
import Link from 'next/link';
import { usePagination } from '@/providers/use-pagination';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { PaginationButtons } from '@/components/ui/pagination/pagination-buttons';
import { useEffect } from 'react';

interface EventsTableProps {
  organizationId?: string;
}

const EVENT_DETAILS = [
  {
    label: 'Event ID',
    value: (event: EventSummary) => event.id,
    copy: true,
  },
  {
    label: 'Timestamp',
    value: (event: EventSummary) => event.created_at,
    copy: false,
  },
  {
    label: 'Summary',
    value: (event: EventSummary) => event.summary,
    copy: false,
  },
] as const;

export function EventsTable({ organizationId }: EventsTableProps) {
  const { reset, ...pagination } = usePagination();

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
      },
    },
  );

  const events = eventsData?.items || [];
  const nextPageToken = eventsData?.next_page_token || '';

  useEffect(() => {
    reset();
  }, [organizationId, reset]);

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
              <Table.ColumnHeaderCell>Link</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {events.map((event) => (
              <HoverCard.Root key={event.id}>
                <HoverCard.Trigger>
                  <Table.Row style={{ cursor: 'pointer' }}>
                    <Table.Cell>{event.type}</Table.Cell>
                    <Table.Cell>{new Date(event.created_at).toLocaleString()}</Table.Cell>
                    <Table.Cell>{event.summary}</Table.Cell>
                    <Table.Cell>
                      {event.link && (
                        <Link href={event.link} target="_blank" rel="noopener noreferrer">
                          View
                        </Link>
                      )}
                    </Table.Cell>
                  </Table.Row>
                </HoverCard.Trigger>
                <HoverCard.Content>
                  <DataList.Root>
                    {EVENT_DETAILS.map((detail) => (
                      <DataList.Item key={detail.label}>
                        <DataList.Label>{detail.label}</DataList.Label>
                        <DataList.Value>
                          <Flex align="center" gap="2" justify="between" width="100%">
                            {detail.value(event)}
                            {detail.copy && (
                              <CopyToClipBoard content={detail.value(event)} tooltipContent={`Copy ${detail.label}`} />
                            )}
                          </Flex>
                        </DataList.Value>
                      </DataList.Item>
                    ))}
                  </DataList.Root>

                  {event.details && (
                    <CodeSnippetCard
                      title="Details"
                      content={JSON.stringify(event.details, undefined, 2)}
                      tooltipContent="Copy details"
                    />
                  )}
                </HoverCard.Content>
              </HoverCard.Root>
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
