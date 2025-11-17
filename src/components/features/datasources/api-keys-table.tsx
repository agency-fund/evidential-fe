'use client';
import { useState } from 'react';
import { getListApiKeysKey, useDeleteApiKey, useListApiKeys } from '@/api/admin';
import { AlertDialog, Button, Flex, Heading, IconButton, Spinner, Table, Text, Tooltip } from '@radix-ui/themes';
import { mutate } from 'swr';
import { InfoCircledIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { CreateApiKeyDialog } from '@/components/features/datasources/create-api-key-dialog';
import { GenericErrorCallout } from '@/components/ui/generic-error';

export function ApiKeysTable({ datasourceId }: { datasourceId: string }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmingDeleteForKeyId, setConfirmingDeleteForKeyId] = useState<string | null>(null);

  const { data, isLoading, error } = useListApiKeys(datasourceId);

  const { trigger } = useDeleteApiKey(
    datasourceId,
    confirmingDeleteForKeyId ?? '',
    { allow_missing: true },
    {
      swr: { onSuccess: () => mutate(getListApiKeysKey(datasourceId)) },
    },
  );

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !data) {
    return <GenericErrorCallout title="Error loading API keys" error={error} />;
  }

  const filteredApiKeys = data.items.filter((key) => key.datasource_id === datasourceId);

  return (
    <Flex direction="column" gap="3">
      <CreateApiKeyDialog datasourceId={datasourceId} open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <Flex justify="between">
        <Heading size="4">API Keys</Heading>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon /> Add API Key
        </Button>
      </Flex>

      {filteredApiKeys.length > 0 ? (
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
              {filteredApiKeys.map((item) => {
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusIcon /> Add API Key
          </Button>
        </EmptyStateCard>
      )}
    </Flex>
  );
}
