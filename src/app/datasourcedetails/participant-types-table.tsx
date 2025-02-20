'use client';
import { useListParticipantTypes } from '@/api/admin';
import { Spinner, Table, Text } from '@radix-ui/themes';
import { isHttpOk } from '@/services/typehelper';
import Link from 'next/link';
import { DeleteParticipantTypeDialog } from '@/app/datasourcedetails/delete-participant-type-dialog';

export function ParticipantTypesTable({ datasourceId }: { datasourceId: string }) {
  const { data, isLoading, error } = useListParticipantTypes(datasourceId);

  if (isLoading) return <Spinner />;
  if (error || !isHttpOk(data)) return <Text>Error loading participant types: {JSON.stringify(error)}</Text>;

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Participant Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Table Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.data.items?.map((item) => (
          <Table.Row key={item.participant_type}>
            <Table.Cell>
              <Link
                href={`/participanttypedetails?datasource_id=${datasourceId}&participant_type=${item.participant_type}`}
              >
                {item.participant_type}
              </Link>
            </Table.Cell>
            <Table.Cell>{item.table_name}</Table.Cell>
            <Table.Cell>
              <DeleteParticipantTypeDialog datasourceId={datasourceId} participantType={item.participant_type} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
