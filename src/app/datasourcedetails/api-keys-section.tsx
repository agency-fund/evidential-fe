'use client';
import { AlertDialog, Button, Flex, Heading, IconButton, Spinner, Table, Text } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { getListApiKeysKey, useDeleteApiKey, useListApiKeys } from '@/api/admin';
import { ApiKeySummary } from '@/api/methods.schemas';
import { isSuccessResponse } from '@/services/typehelper';
import { mutate } from 'swr';
import { CreateApiKeyDialog } from '@/app/datasourcedetails/create-api-key-dialog';

function ApiKeysTable({ apiKeys }: { apiKeys: ApiKeySummary[] }) {
  const [confirmingDeleteForKeyId, setConfirmingDeleteForKeyId] = useState<string | null>(null);
  const { trigger } = useDeleteApiKey(confirmingDeleteForKeyId ?? '');

  return (
    <Flex direction="column" gap="3">
      <AlertDialog.Root open={confirmingDeleteForKeyId !== null} onOpenChange={() => setConfirmingDeleteForKeyId(null)}>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete API key: {confirmingDeleteForKeyId}</AlertDialog.Title>
          <AlertDialog.Description size="2">
            Are you sure? This API key will no longer be usable.
          </AlertDialog.Description>
          <form
            onSubmit={(event) => {
              setConfirmingDeleteForKeyId(null);
              event.preventDefault();
            }}
          >
            <Flex gap="3" mt="4" justify="end">
              <AlertDialog.Cancel>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action onClick={(event) => event.preventDefault()}>
                <Button
                  variant="solid"
                  color="red"
                  onClick={async () => {
                    if (confirmingDeleteForKeyId === null) {
                      throw Error('invalid state');
                    }
                    await trigger();
                    await mutate(getListApiKeysKey());
                    return setConfirmingDeleteForKeyId(null);
                  }}
                >
                  Revoke access
                </Button>
              </AlertDialog.Action>
            </Flex>
          </form>
        </AlertDialog.Content>
      </AlertDialog.Root>
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Key ID</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {apiKeys.map((item) => {
            return (
              <Table.Row key={item.id}>
                <Table.Cell>{item.id}</Table.Cell>
                <Table.Cell>
                  <IconButton color="red" variant="soft" onClick={() => setConfirmingDeleteForKeyId(item.id)}>
                    <TrashIcon />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Flex>
  );
}

export const ApiKeysSection = ({ datasourceId }: { datasourceId: string }) => {
  const { data: apiKeys, isLoading, error } = useListApiKeys();

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !isSuccessResponse(apiKeys)) {
    return <Text>Error loading API keys: {JSON.stringify(error)}</Text>;
  }

  const filteredApiKeys = apiKeys.data.items.filter((key) => key.datasource_id === datasourceId);

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading size="4">API Keys</Heading>
        <CreateApiKeyDialog datasourceId={datasourceId} />
      </Flex>
      <ApiKeysTable apiKeys={filteredApiKeys} />
    </Flex>
  );
};
