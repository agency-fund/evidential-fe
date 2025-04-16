'use client';
import { Table, Text } from '@radix-ui/themes';
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
            <Table.Row key={event.id}>
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
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}
