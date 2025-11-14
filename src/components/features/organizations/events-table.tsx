'use client';
import { DataList, Flex, HoverCard, Heading, Table } from '@radix-ui/themes';
import { EventSummary } from '@/api/methods.schemas';
import Link from 'next/link';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';

interface EventsTableProps {
  events: EventSummary[];
  isLoading: boolean;
  error?: Error;
}

export function EventsTable({ events, isLoading, error }: EventsTableProps) {
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

      {isLoading ? (
        <XSpinner message="Loading events..." />
      ) : error ? (
        <GenericErrorCallout title="Failed to fetch events" error={error as Error} />
      ) : events.length === 0 ? (
        <EmptyStateCard title="No events found" description="Events will appear here" />
      ) : (
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
      )}
    </Flex>
  );
}
