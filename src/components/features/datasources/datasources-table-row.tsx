'use client';
import { Button, Flex, IconButton, Table, Text, Tooltip } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import Link from 'next/link';
import { DeleteDatasourceDialog } from '@/components/features/datasources/delete-datasource-dialog';
import { EditDatasourceDialog } from '@/components/features/datasources/edit-datasource-dialog';
import { useListParticipantTypes } from '@/api/admin';
import { PersonIcon, PlusIcon } from '@radix-ui/react-icons';

export default function DatasourceRow({
  datasource,
  organizationId,
}: {
  datasource: {
    id: string;
    name: string;
    driver: string;
  };
  organizationId: string;
}) {
  const { data: participantTypesData, isLoading, error } = useListParticipantTypes(datasource.id);
  return (
    <>
      <Table.Row key={datasource.id}>
        <Table.Cell>
          <Flex align="center" gap="2">
            <Link href={`/datasources/${datasource.id}`}>{datasource.name}</Link>
            <CopyToClipBoard content={datasource.id} tooltipContent="Copy Datasource ID" />
          </Flex>
        </Table.Cell>
        <Table.Cell>
          {datasource.driver === 'none' ? (
            <Text color="gray">Not applicable</Text>
          ) : isLoading ? (
            <Text color="gray">Loading...</Text>
          ) : error ? (
            <Text color="red">Error loading types</Text>
          ) : participantTypesData?.items.length ? (
            <Flex direction="column" gap="1">
              {participantTypesData.items.map((participantType) => (
                <Link
                  href={`/datasources/${datasource.id}/participants/${participantType.participant_type}`}
                  key={participantType.participant_type}
                >
                  {participantType.participant_type}
                </Link>
              ))}
            </Flex>
          ) : (
            <Link href={`/datasources/${datasource.id}/participants/create`}>
              <Button size="1">
                <PlusIcon />
                Add participant type
              </Button>
            </Link>
          )}
        </Table.Cell>

        <Table.Cell>
          {datasource.driver === 'bigquery' && 'Google BigQuery'}
          {datasource.driver === 'postgresql+psycopg' && 'PostgreSQL'}
          {datasource.driver === 'postgresql+psycopg2' && 'Redshift'}
          {datasource.driver === 'none' && <em>no warehouse</em>}
        </Table.Cell>
        <Table.Cell>
          <Flex gap="2">
            <Tooltip
              content={
                datasource.driver === 'none'
                  ? 'Cannot add participant types without a warehouse'
                  : 'Add Participant Type'
              }
            >
              {datasource.driver === 'none' ? (
                <IconButton variant="soft" color="gray" disabled>
                  <PersonIcon />
                </IconButton>
              ) : (
                <Link href={`/datasources/${datasource.id}/participants/create`}>
                  <IconButton variant="soft" color="blue">
                    <PersonIcon />
                  </IconButton>
                </Link>
              )}
            </Tooltip>
            <EditDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
            <DeleteDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
          </Flex>
        </Table.Cell>
      </Table.Row>
    </>
  );
}
