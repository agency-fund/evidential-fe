'use client';
import { useListParticipantTypes } from '@/api/admin';
import { Table } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import Link from 'next/link';
import { DeleteParticipantTypeDialog } from '@/app/datasourcedetails/delete-participant-type-dialog';
import { GenericErrorCallout } from '@/app/components/generic-error';

export function ParticipantTypesTable({ datasourceId }: { datasourceId: string }) {
  const { data, isLoading, error } = useListParticipantTypes(datasourceId);

  if (isLoading) return <XSpinner message="Loading participant types..." />;
  if (error) return <GenericErrorCallout title={'Failed to load participant types'} error={error} />;

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
        {data?.items?.map((item) => (
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
