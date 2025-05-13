'use client';
import { useListParticipantTypes } from '@/api/admin';
import { Table } from '@radix-ui/themes';
import { XSpinner } from '@/app/components/ui/x-spinner';
import Link from 'next/link';
import { DeleteParticipantTypeDialog } from '@/app/components/features/participants/delete-participant-type-dialog';
import { GenericErrorCallout } from '@/app/components/ui/generic-error';
import { EditParticipantTypeDialog } from '@/app/components/features/participants/edit-participant-type-dialog';
import { Flex } from '@radix-ui/themes';
import { EmptyStateCard } from '@/app/components/ui/cards/empty-state-card';
import { AddParticipantTypeDialog } from '@/app/components/features/participants/add-participant-type-dialog';

export function ParticipantTypesTable({ datasourceId }: { datasourceId: string }) {
  const { data, isLoading, error } = useListParticipantTypes(datasourceId);

  if (isLoading) return <XSpinner message="Loading participant types..." />;
  if (error) return <GenericErrorCallout title={'Failed to load participant types'} error={error} />;

  return (
    <>
      {data?.items && data.items.length > 0 ? (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Participant Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Table Name</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.items.map((item) => (
              <Table.Row key={item.participant_type}>
                <Table.Cell>
                  <Link href={`/datasources/${datasourceId}/participants/${item.participant_type}`}>
                    {item.participant_type}
                  </Link>
                </Table.Cell>
                <Table.Cell>{item.table_name}</Table.Cell>
                <Table.Cell>
                  <Flex gap="2">
                    {item.type === 'schema' && (
                      <EditParticipantTypeDialog
                        datasourceId={datasourceId}
                        participantType={item.participant_type}
                        participantConfig={item}
                        variant="icon"
                      />
                    )}
                    <DeleteParticipantTypeDialog datasourceId={datasourceId} participantType={item.participant_type} />
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      ) : (
        <EmptyStateCard title="No participant types found" description="Add a participant type to get started">
          <AddParticipantTypeDialog datasourceId={datasourceId} />
        </EmptyStateCard>
      )}
    </>
  );
}
