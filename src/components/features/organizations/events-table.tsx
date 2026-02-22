'use client';
import { Button, DataList, Flex, Heading, HoverCard, Select, Table } from '@radix-ui/themes';
import { useListOrganizationEvents } from '@/api/admin';
import { EventSummary } from '@/api/methods.schemas';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { useEffect, useState } from 'react';

const DEFAULT_EVENTS_PAGE_SIZE = '10';
const EVENTS_PAGE_SIZE_OPTIONS = ['10', '50', '100'] as const;

type EventsPageSize = (typeof EVENTS_PAGE_SIZE_OPTIONS)[number];

interface EventsTableProps {
  organizationId?: string;
}

const isEventsPageSize = (value: string): value is EventsPageSize => {
  return EVENTS_PAGE_SIZE_OPTIONS.includes(value as EventsPageSize);
};

export function EventsTable({ organizationId }: EventsTableProps) {
  const [eventsPageTokens, setEventsPageTokens] = useState<string[]>(['']);
  const [eventsPageSize, setEventsPageSize] = useState<EventsPageSize>(DEFAULT_EVENTS_PAGE_SIZE);

  const currentPageToken = eventsPageTokens[eventsPageTokens.length - 1];

  const {
    data: eventsData,
    isLoading,
    error,
  } = useListOrganizationEvents(
    organizationId ?? '',
    { page_size: Number(eventsPageSize), page_token: currentPageToken },
    {
      swr: {
        keepPreviousData: true,
        enabled: !!organizationId,
      },
    },
  );

  const events = eventsData?.items || [];
  const nextPageToken = eventsData?.next_page_token || '';

  const canGoToPreviousPage = eventsPageTokens.length > 1 && !isLoading;
  const canGoToNextPage = !!nextPageToken && !isLoading;

  useEffect(() => {
    setEventsPageTokens(['']);
  }, [eventsPageSize, organizationId]);

  const goToPreviousPage = () => {
    setEventsPageTokens((previousTokens) => {
      if (previousTokens.length <= 1) {
        return previousTokens;
      }

      return previousTokens.slice(0, -1);
    });
  };

  const goToNextPage = () => {
    if (!nextPageToken) {
      return;
    }

    setEventsPageTokens((previousTokens) => [...previousTokens, nextPageToken]);
  };

  const setPageSize = (value: string) => {
    if (!isEventsPageSize(value)) {
      return;
    }

    setEventsPageSize(value);
  };

  const eventDetails = [
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
  ];

  return (
    <Flex direction="column" gap="3">
      <Heading size="4">Recent Events</Heading>

      {!organizationId ? (
        <EmptyStateCard title="No events found" description="Missing organization ID" />
      ) : isLoading && eventsData === undefined ? (
        <XSpinner message="Loading events..." />
      ) : error ? (
        <GenericErrorCallout title="Failed to fetch events" error={error as Error} />
      ) : events.length === 0 ? (
        <EmptyStateCard title="No events found" description="Events will appear here" />
      ) : (
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
                      {eventDetails.map((detail) => (
                        <DataList.Item key={detail.label}>
                          <DataList.Label>{detail.label}</DataList.Label>
                          <DataList.Value>
                            <Flex align="center" gap="2" justify="between" width="100%">
                              {detail.value(event)}
                              {detail.copy && (
                                <CopyToClipBoard
                                  content={detail.value(event)}
                                  tooltipContent={`Copy ${detail.label}`}
                                />
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
            <Select.Root value={eventsPageSize} onValueChange={setPageSize} size="1">
              <Select.Trigger />
              <Select.Content position="popper">
                {EVENTS_PAGE_SIZE_OPTIONS.map((option) => (
                  <Select.Item key={option} value={option}>
                    {option}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={goToPreviousPage}
              disabled={!canGoToPreviousPage}
              loading={isLoading}
            >
              <ChevronLeftIcon />
              Prev
            </Button>
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={goToNextPage}
              disabled={!canGoToNextPage}
              loading={isLoading}
            >
              Next
              <ChevronRightIcon />
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}
