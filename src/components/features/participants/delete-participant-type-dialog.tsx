'use client';
import { IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import {
  getGetDatasourceKey,
  getInspectParticipantTypesKey,
  getListParticipantTypesKey,
  useDeleteParticipant,
} from '@/api/admin';
import { mutate } from 'swr';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';

interface DeleteParticipantTypeDialogProps {
  datasourceId: string;
  participantType: string;
}

export const DeleteParticipantTypeDialog = ({ datasourceId, participantType }: DeleteParticipantTypeDialogProps) => {
  const { trigger, isMutating } = useDeleteParticipant(
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
        },
      },
    },
  );

  return (
    <DeleteAlertDialog
      title="Delete Participant Type"
      description="Are you sure you want to delete this participant type? This action cannot be undone."
      trigger={trigger}
      loading={isMutating}
      renderTrigger={() => (
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      )}
    >
      Deleting a participant type will remove notes and may invalidate active or future experiments.
    </DeleteAlertDialog>
  );
};
