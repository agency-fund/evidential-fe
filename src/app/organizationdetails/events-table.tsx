'use client';
import { Code, DataList, Flex, HoverCard, Table, Text } from '@radix-ui/themes';
import { EventSummary } from '@/api/methods.schemas';
import Link from 'next/link';
import { CodeSnippetCard } from '@/app/components/cards/code-snippet-card';
import { CopyToClipBoard } from '@/app/components/buttons';

export function EventsTable({ events }: { events: EventSummary[] }) {
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
        {events.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <Text align="center">No events found</Text>
            </Table.Cell>
          </Table.Row>
        ) : (
          events.map((event) => (
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
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}
