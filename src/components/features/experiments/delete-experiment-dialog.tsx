'use client';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import { getListOrganizationExperimentsKey, useDeleteExperiment } from '@/api/admin';
import { mutate } from 'swr';

interface DeleteExperimentDialogProps {
  organizationId: string;
  datasourceId: string;
  experimentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteExperimentDialog({
  datasourceId,
  experimentId,
  organizationId,
  open,
  onOpenChange,
}: DeleteExperimentDialogProps) {
  const { trigger, isMutating } = useDeleteExperiment(
    datasourceId,
    experimentId,
    { allow_missing: true },
    {
      swr: { onSuccess: () => mutate(getListOrganizationExperimentsKey(organizationId)) },
    },
  );

  const handleDelete = async () => {
    await trigger();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>Delete Experiment</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Are you sure you want to delete this experiment?
        </Dialog.Description>

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </Dialog.Close>
          <Button color="red" loading={isMutating} onClick={handleDelete}>
            Delete
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
