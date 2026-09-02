'use client';
import { useState } from 'react';
import { Button, Flex, IconButton, Table, Text, Tooltip } from '@radix-ui/themes';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import Link from 'next/link';
import { DeleteDatasourceDialog } from '@/components/features/datasources/delete-datasource-dialog';
import { EditDatasourceDialog } from '@/components/features/datasources/edit-datasource-dialog';
import { CreateApiKeyDialog } from '@/components/features/datasources/create-api-key-dialog';
import { useListApiKeys } from '@/api/admin';
import { LockClosedIcon, PlusIcon } from '@radix-ui/react-icons';

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
  const { data: apiKeysData, isLoading: isApiKeysLoading, error: apiKeysError } = useListApiKeys(datasource.id);
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
            <EditDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
            <DeleteDatasourceDialog organizationId={organizationId} datasourceId={datasource.id} />
          </Flex>
        </Table.Cell>
      </Table.Row>
    </>
  );
}
