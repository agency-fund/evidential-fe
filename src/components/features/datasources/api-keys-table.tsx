'use client';
import { ApiKeySummary } from '@/api/methods.schemas';
import { useState } from 'react';
import { getListApiKeysKey, useDeleteApiKey } from '@/api/admin';
import { AlertDialog, Button, Flex, IconButton, Table, Text, Tooltip } from '@radix-ui/themes';
import { mutate } from 'swr';
import { InfoCircledIcon, TrashIcon } from '@radix-ui/react-icons';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { CreateApiKeyDialog } from '@/components/features/datasources/create-api-key-dialog';
import { ApiKeyResultsDialog } from '@/components/features/datasources/api-key-results-dialog';

export function ApiKeysTable({ apiKeys, datasourceId }: { apiKeys: ApiKeySummary[]; datasourceId: string }) {
  const [confirmingDeleteForKeyId, setConfirmingDeleteForKeyId] = useState<string | null>(null);
  const { trigger } = useDeleteApiKey(
    datasourceId,
    confirmingDeleteForKeyId ?? '',
    { allow_missing: true },
    {
      swr: { onSuccess: () => mutate(getListApiKeysKey(datasourceId)) },
    },
  );

  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ key: string } | undefined>(undefined);

  const handleKeyCreated = (key: { key: string }) => {
    setNewlyCreatedKey(key);
  };

  return (
    <>
      {newlyCreatedKey && (
        <ApiKeyResultsDialog
          createdKey={newlyCreatedKey}
          datasourceId={datasourceId}
          isOpen={true}
          onOpenChange={(open) => {
            if (!open) {
              setNewlyCreatedKey(undefined);
            }
          }}
        />
      )}

      {apiKeys.length > 0 ? (
        <Flex direction="column" gap="3">
          <AlertDialog.Root
            open={confirmingDeleteForKeyId !== null}
            onOpenChange={() => setConfirmingDeleteForKeyId(null)}
          >
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
                <Table.ColumnHeaderCell>
                  <Tooltip content="Use key IDs to distinguish API keys from one another.">
                    <Text>
                      Key ID
                      <InfoCircledIcon style={{ verticalAlign: 'middle', marginLeft: '0.25rem' }} />
                    </Text>
                  </Tooltip>
                </Table.ColumnHeaderCell>
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
      ) : (
        <EmptyStateCard title="No API keys found" description="Add an API key to get started">
          <CreateApiKeyDialog datasourceId={datasourceId} onKeyCreated={handleKeyCreated} />
        </EmptyStateCard>
      )}
    </>
  );
}
