'use client';
import { useState } from 'react';
import { Button, Flex, IconButton, Table, Text, Tooltip } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import Link from 'next/link';
import { DeleteDatasourceDialog } from '@/components/features/datasources/delete-datasource-dialog';
import { EditDatasourceDialog } from '@/components/features/datasources/edit-datasource-dialog';
import { CreateApiKeyDialog } from '@/components/features/datasources/create-api-key-dialog';
import { useListApiKeys, useListParticipantTypes } from '@/api/admin';
import { LockClosedIcon, PersonIcon, PlusIcon } from '@radix-ui/react-icons';

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
  const [createApiKeyDialogOpen, setCreateApiKeyDialogOpen] = useState(false);
  const { data: participantTypesData, isLoading, error } = useListParticipantTypes(datasource.id);
  const { data: apiKeysData, isLoading: isApiKeysLoading, error: apiKeysError } = useListApiKeys(datasource.id);
  const doesDriverSupportParticipants = datasource.driver !== 'none';
  // Don't show the "+ Participant Type" buttons when a datasource is only used by experiments built using the new
  // flows.
  const isParticipantTypeAllowed = participantTypesData?.items?.length === 0 ? !participantTypesData?.has_hidden : true;
  const showAddParticipantType = doesDriverSupportParticipants && isParticipantTypeAllowed;
  return (
    <>
      <CreateApiKeyDialog
        datasourceId={datasource.id}
        open={createApiKeyDialogOpen}
        onOpenChange={setCreateApiKeyDialogOpen}
      />
      <Table.Row key={datasource.id}>
        <Table.Cell>
          <Flex align="center" gap="2">
            <Link href={`/datasources/${datasource.id}`}>{datasource.name}</Link>
            <CopyToClipBoard content={datasource.id} tooltipContent="Copy Datasource ID" />
          </Flex>
        </Table.Cell>

        <Table.Cell>
          {isApiKeysLoading ? (
            <Text color="gray">Loading...</Text>
          ) : apiKeysError ? (
            <Text color="red">Error loading keys</Text>
          ) : apiKeysData?.items.length ? (
            <Flex direction="column" gap="1">
              <Link
                href={`/datasources/${datasource.id}`}
              >{`${apiKeysData.items.length} key${apiKeysData.items.length === 1 ? '' : 's'}`}</Link>
            </Flex>
          ) : (
            <Button size="1" onClick={() => setCreateApiKeyDialogOpen(true)}>
              <PlusIcon />
              Add API Key
            </Button>
          )}
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
            <>
              {showAddParticipantType ? (
                <Link href={`/datasources/${datasource.id}/participants/create`}>
                  <Button size="1">
                    <PlusIcon />
                    Add participant type
                  </Button>
                </Link>
              ) : null}
            </>
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
            <Tooltip content="Add API Key">
              <IconButton variant="soft" color="green" onClick={() => setCreateApiKeyDialogOpen(true)}>
                <LockClosedIcon />
              </IconButton>
            </Tooltip>
            {showAddParticipantType ? (
              <>
                <Tooltip content={'Add Participant Type'}>
                  <Link href={`/datasources/${datasource.id}/participants/create`}>
                    <IconButton variant="soft" color="blue">
                      <PersonIcon />
                    </IconButton>
                  </Link>
                </Tooltip>
              </>
            ) : null}
            <EditDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
            <DeleteDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
          </Flex>
        </Table.Cell>
      </Table.Row>
    </>
  );
}
