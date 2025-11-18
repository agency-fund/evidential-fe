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
  const [confirmationText, setConfirmationText] = useState('');
  const [open, setOpen] = useState(false);

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
          setOpen(false);
          setConfirmationText('');
        },
      },
    },
  );

  const isConfirmed = confirmationText === 'delete';

  const handleDelete = async () => {
    if (isConfirmed) {
      await trigger();
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger>
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && isConfirmed) {
            e.preventDefault();
            await handleDelete();
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
            value={confirmationText}
            autoFocus={true}
            onChange={(e) => setConfirmationText(e.target.value)}
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
                await handleDelete();
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
