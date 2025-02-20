'use client';
import { ApiKeySummary } from '@/api/methods.schemas';
import { useState } from 'react';
import { getListApiKeysKey, useDeleteApiKey } from '@/api/admin';
import { AlertDialog, Button, Flex, IconButton, Table } from '@radix-ui/themes';
import { mutate } from 'swr';
import { TrashIcon } from '@radix-ui/react-icons';

export function ApiKeysTable({ apiKeys }: { apiKeys: ApiKeySummary[] }) {
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
