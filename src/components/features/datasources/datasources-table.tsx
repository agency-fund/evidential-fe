'use client';
import { Button, Flex, IconButton, Table, Text, Tooltip, Box } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import Link from 'next/link';
import { DeleteDatasourceDialog } from '@/components/features/datasources/delete-datasource-dialog';
import { EditDatasourceDialog } from '@/components/features/datasources/edit-datasource-dialog';
import { useListParticipantTypes } from '@/api/admin';
import { PersonIcon, ChevronDownIcon, ChevronRightIcon, PlusIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <Table.Row key={datasource.id}>
        <Table.Cell>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <IconButton variant="ghost" size="1" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
              </IconButton>
              <Link href={`/datasources/${datasource.id}`}>{datasource.name}</Link>
              <CopyToClipBoard content={datasource.id} tooltipContent="Copy Datasource ID" />
            </Flex>
            {isLoading ? (
              <Text size="1" color="gray">
                Loading...
              </Text>
            ) : error ? (
              <Text size="1" color="gray">
                Error loading
              </Text>
            ) : participantTypesData?.items && participantTypesData.items.length > 0 ? (
              <Button variant="ghost" size="1" color="blue" onClick={() => setIsExpanded(!isExpanded)}>
                <PersonIcon /> {participantTypesData.items.length} participant type
                {participantTypesData.items.length === 1 ? '' : 's'}
              </Button>
            ) : (
              <Link href={`/datasources/${datasource.id}/participants/create`}>
                <Button variant="ghost" size="1" color="blue">
                  <PlusIcon /> Add participant type
                </Button>
              </Link>
            )}
          </Flex>
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
      {/* Expanded row for actions - simple conditional rendering */}
      {isExpanded && (
        <Table.Row style={{ background: 'var(--blue-2)' }}>
          <Table.Cell colSpan={4}>
            <Box p="3">
              <Flex direction="column" gap="2">
                <Text size="2" weight="medium" color="gray">
                  Participant Types:
                </Text>
                {isLoading ? (
                  <Text size="2" color="gray">
                    Loading...
                  </Text>
                ) : error ? (
                  <Text size="2" color="gray">
                    Error loading participant types
                  </Text>
                ) : (
                  <Flex direction="column" gap="2">
                    {participantTypesData?.items && participantTypesData.items.length > 0 && (
                      <Flex gap="2" wrap="wrap">
                        {participantTypesData.items.map((item, index) => (
                          <Link
                            key={index}
                            href={`/datasources/${datasource.id}/participants/${item.participant_type}`}
                          >
                            <Button variant="surface" size="2" color="gray">
                              <Flex align="center" gap="2">
                                <PersonIcon />
                                <Text size="2">{item.participant_type}</Text>
                              </Flex>
                            </Button>
                          </Link>
                        ))}
                      </Flex>
                    )}
                    <Link href={`/datasources/${datasource.id}/participants/create`}>
                      <Button variant="ghost" size="2" color="blue">
                        <PlusIcon /> Add participant type
                      </Button>
                    </Link>
                  </Flex>
                )}
              </Flex>
            </Box>
          </Table.Cell>
        </Table.Row>
      )}
    </>
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
