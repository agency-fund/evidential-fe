'use client';
import { AlertDialog, Button, DropdownMenu, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { useState } from 'react';
import { getListOrganizationExperimentsKey, useDeleteExperiment } from '@/api/admin';
import { mutate } from 'swr';
import { DotsVerticalIcon, TrashIcon } from '@radix-ui/react-icons';

interface ExperimentActionsMenuProps {
  organizationId: string;
  datasourceId: string;
  experimentId: string;
}

export function ExperimentActionsMenu({ datasourceId, experimentId, organizationId }: ExperimentActionsMenuProps) {
  const [confirmation, setConfirmation] = useState<{ dialog: 'closed' } | { dialog: 'open'; text: string }>({
    dialog: 'closed',
  });

  const { trigger, isMutating } = useDeleteExperiment(
    datasourceId,
    experimentId,
    { allow_missing: true },
    {
      swr: {
        onSuccess: async () => {
          await mutate(getListOrganizationExperimentsKey(organizationId));
          setConfirmation({ dialog: 'closed' });
        },
      },
    },
  );

  const isOpen = confirmation.dialog === 'open';
  const isConfirmed = isOpen && confirmation.text === 'delete';

  return (
    <>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger>
          <IconButton variant="ghost" color="gray" size="1">
            <DotsVerticalIcon width="16" height="16" />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" side="bottom">
          <DropdownMenu.Item color="red" onClick={() => setConfirmation({ dialog: 'open', text: '' })}>
            <TrashIcon /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

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
        <AlertDialog.Content
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && isConfirmed) {
              e.preventDefault();
              await trigger();
            }
          }}
        >
          <AlertDialog.Title>Delete Experiment</AlertDialog.Title>
          <AlertDialog.Description>
            Are you sure you want to delete this experiment? This action cannot be undone.
          </AlertDialog.Description>

          <Flex direction={'column'} mt={'4'}>
            <Text as="p" mb={'3'}>
              Deleting an experiment will delete all associated assignments, state, and snapshots.
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
                color="red"
                disabled={!isConfirmed}
                loading={isMutating}
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
    </>
  );
}
