import { ParticipantsDef } from '@/api/methods.schemas';
import { getGetParticipantTypesKey, getInspectParticipantTypesKey, useUpdateParticipantType } from '@/api/admin';
import { useState } from 'react';
import { mutate } from 'swr';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { XSpinner } from '@/app/components/x-spinner';
import { ParticipantDefEditor } from '@/app/participanttypedetails/edit-participant-def';

export function EditParticipantTypeDialog({
  datasourceId,
  participantType,
  participantConfig,
}: {
  datasourceId: string;
  participantType: string;
  participantConfig: ParticipantsDef;
}) {
  const { trigger: updateParticipantType, isMutating } = useUpdateParticipantType(datasourceId, participantType, {
    swr: {
      onSuccess: () => {
        setOpen(false);
      },
    },
  });
  const [editedDef, setEditedDef] = useState<ParticipantsDef | null>(null);
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    if (!editedDef) return;
    await updateParticipantType({
      fields: editedDef.fields,
    });
    await Promise.all([
      mutate(getGetParticipantTypesKey(datasourceId, participantType)),
      mutate(getInspectParticipantTypesKey(datasourceId, participantType, {})),
    ]);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>
          <Pencil2Icon /> Edit Participant Type
        </Button>
      </Dialog.Trigger>
      <Dialog.Content minWidth={'800px'} maxWidth={'90vw'} maxHeight={'90vh'}>
        <Dialog.Title>Add Participant Type</Dialog.Title>
        {isMutating ? (
          <XSpinner message={'Saving...'} />
        ) : (
          <>
            <ParticipantDefEditor participantDef={editedDef || participantConfig} onUpdate={setEditedDef} />
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" onClick={() => setEditedDef(null)}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button onClick={handleSave} disabled={!editedDef}>
                Save Changes
              </Button>
            </Flex>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
