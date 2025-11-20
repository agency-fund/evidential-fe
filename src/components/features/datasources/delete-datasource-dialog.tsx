'use client';
import { AlertDialog, Button, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { getGetOrganizationKey, useDeleteDatasource } from '@/api/admin';
import { mutate } from 'swr';
import { useState } from 'react';
import { TrashIcon } from '@radix-ui/react-icons';

interface DeleteDatasourceDialogProps {
  organizationId: string;
  datasourceId: string;
}

export function DeleteDatasourceDialog({ organizationId, datasourceId }: DeleteDatasourceDialogProps) {
  const [confirmation, setConfirmation] = useState<{ dialog: 'closed' } | { dialog: 'open'; text: string }>({
    dialog: 'closed',
  });

  const { trigger } = useDeleteDatasource(
    organizationId,
    datasourceId,
    { allow_missing: true },
    {
      swr: {
        onSuccess: async () => {
          await mutate(getGetOrganizationKey(organizationId));
          setConfirmation({ dialog: 'closed' });
        },
      },
    },
  );

  const isOpen = confirmation.dialog === 'open';
  const isConfirmed = isOpen && confirmation.text === 'delete';

  return (
    <AlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          setConfirmation({ dialog: 'open', text: '' });
        } else {
          setConfirmation({ dialog: 'closed' });
        }
      }}
    >
      <AlertDialog.Trigger>
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && isConfirmed) {
            e.preventDefault();
            await trigger();
          }
        }}
      >
        <AlertDialog.Title>Delete Datasource</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to delete this datasource? This action cannot be undone.
        </AlertDialog.Description>

        <Flex direction={'column'} mt={'4'}>
          <Text as="p" mb={'3'}>
            Deleting a datasource will delete all associated experiments, their arm assignments, draws, contexts,
            snapshots, and API keys.
          </Text>
          <Text as="p" mb={'3'}>
            Please type &apos;delete&apos; in this text box to confirm.
          </Text>
          <TextField.Root
            value={isOpen ? confirmation.text : ''}
            autoFocus={true}
            onChange={(e) => setConfirmation({ dialog: 'open', text: e.target.value })}
            placeholder="delete"
          />
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color="red"
              disabled={!isConfirmed}
              onClick={async (e) => {
                if (!isConfirmed) {
                  e.preventDefault();
                  return;
                }
                await trigger();
              }}
            >
              Delete
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
