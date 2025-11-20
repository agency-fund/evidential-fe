'use client';
import { AlertDialog, Button, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import {
  getGetDatasourceKey,
  getInspectParticipantTypesKey,
  getListParticipantTypesKey,
  useDeleteParticipant,
} from '@/api/admin';
import { mutate } from 'swr';
import { useState } from 'react';

interface DeleteParticipantTypeDialogProps {
  datasourceId: string;
  participantType: string;
}

export const DeleteParticipantTypeDialog = ({ datasourceId, participantType }: DeleteParticipantTypeDialogProps) => {
  const [confirmation, setConfirmation] = useState<{ dialog: 'closed' } | { dialog: 'open'; text: string }>({
    dialog: 'closed',
  });

  const { trigger } = useDeleteParticipant(
    datasourceId,
    participantType,
    { allow_missing: true },
    {
      swr: {
        onSuccess: async () => {
          await Promise.all([
            mutate(getGetDatasourceKey(datasourceId)),
            mutate(getInspectParticipantTypesKey(datasourceId, participantType)),
            mutate(getListParticipantTypesKey(datasourceId)),
          ]);
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
        <AlertDialog.Title>Delete Participant Type</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to delete this participant type? This action cannot be undone.
        </AlertDialog.Description>

        <Flex direction={'column'} mt={'4'}>
          <Text as="p" mb={'3'}>
            Deleting a participant type will remove notes and may invalidate active or future experiments.
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
};
