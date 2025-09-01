'use client';
import { Button, Flex, IconButton, Table, Text, Tooltip } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import Link from 'next/link';
import { DeleteDatasourceDialog } from '@/components/features/datasources/delete-datasource-dialog';
import { EditDatasourceDialog } from '@/components/features/datasources/edit-datasource-dialog';
import { useListParticipantTypes } from '@/api/admin';
import { PersonIcon } from '@radix-ui/react-icons';

function DatasourceRow({
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
    <Table.Row key={datasource.id}>
      <Table.Cell>
        <Flex align="center" gap="2">
          <Link href={`/datasources/${datasource.id}`}>{datasource.name}</Link>
          <CopyToClipBoard content={datasource.id} tooltipContent="Copy Datasource ID" />
        </Flex>
      </Table.Cell>

      <Table.Cell>
        {isLoading ? (
          <Text>Loading...</Text>
        ) : error ? (
          <Text>Error loading</Text>
        ) : participantTypesData?.items && participantTypesData.items.length > 0 ? (
          <Flex direction="column" gap="2" wrap="wrap">
            {participantTypesData.items.map((item: any, index: number) => (
              <Link key={index} href={`/datasources/${datasource.id}/participants/${item.participant_type}`}>
                {item.participant_type}
              </Link>
            ))}
          </Flex>
        ) : (
          <Link href={`/datasources/${datasource.id}/participants/create`}>
            <Button size="1">
              <PersonIcon /> Add Participant Type
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
          <Tooltip content="Add Participant Type">
            <Link href={`/datasources/${datasource.id}/participants/create`}>
              <IconButton variant="soft" color="blue">
                <PersonIcon />
              </IconButton>
            </Link>
          </Tooltip>
          <EditDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
          <DeleteDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

export function DatasourcesTable({
  datasources,
  organizationId,
}: {
  datasources: {
    id: string;
    name: string;
    driver: string;
  }[];
  organizationId: string;
}) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Participant Types</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Driver</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {datasources.map((datasource) => (
          <DatasourceRow key={datasource.id} datasource={datasource} organizationId={organizationId} />
        ))}
      </Table.Body>
    </Table.Root>
  );
}
