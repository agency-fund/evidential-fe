'use client';
import { Code, DataList, HoverCard, Table, Text } from '@radix-ui/themes';
import { EventSummary } from '@/api/methods.schemas';
import Link from 'next/link';

export function EventsTable({ events }: { events: EventSummary[] }) {
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
                  <DataList.Item>
                    <DataList.Label>Event ID</DataList.Label>
                    <DataList.Value>{event.id}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Timestamp</DataList.Label>
                    <DataList.Value>{new Date(event.created_at).toISOString()}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label>Summary</DataList.Label>
                    <DataList.Value>{event.summary}</DataList.Value>
                  </DataList.Item>
                  {event.details && (
                    <DataList.Item>
                      <DataList.Label>Details</DataList.Label>
                      <DataList.Value>
                        <Code>{JSON.stringify(event.details, undefined, 2)}</Code>
                      </DataList.Value>
                    </DataList.Item>
                  )}
                </DataList.Root>
              </HoverCard.Content>
            </HoverCard.Root>
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}
