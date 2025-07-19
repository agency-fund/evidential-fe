'use client';
import { AlertDialog, Button, Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import {
  getGetDatasourceKey,
  getInspectParticipantTypesKey,
  getListParticipantTypesKey,
  useDeleteParticipant,
} from '@/api/admin';
import { mutate } from 'swr';

interface DeleteParticipantTypeDialogProps {
  datasourceId: string;
  participantType: string;
}

export const DeleteParticipantTypeDialog = ({ datasourceId, participantType }: DeleteParticipantTypeDialogProps) => {
  const { trigger } = useDeleteParticipant(
    datasourceId,
    participantType,
    { allow_missing: true },
    {
      swr: {
        onSuccess: async () =>
          await Promise.all([
            mutate(getGetDatasourceKey(datasourceId)),
            mutate(getInspectParticipantTypesKey(datasourceId, participantType)),
            mutate(getListParticipantTypesKey(datasourceId)),
          ]),
      },
    },
  );

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Delete Participant Type</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to delete this participant type? This action cannot be undone.
        </AlertDialog.Description>
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
              onClick={async () => {
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
