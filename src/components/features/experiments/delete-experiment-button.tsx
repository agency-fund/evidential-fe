'use client';
import { Button, Dialog, Flex, DropdownMenu } from '@radix-ui/themes';
import { useState } from 'react';
import { getListOrganizationExperimentsKey, useDeleteExperiment } from '@/api/admin';
import { mutate } from 'swr';
import { TrashIcon } from '@radix-ui/react-icons';

interface DeleteExperimentButtonProps {
  organizationId: string;
  datasourceId: string;
  experimentId: string;
  asDropdownItem?: boolean;
}

export function DeleteExperimentButton({ datasourceId, experimentId, organizationId, asDropdownItem = false }: DeleteExperimentButtonProps) {
  const [open, setOpen] = useState(false);
  const { trigger, isMutating } = useDeleteExperiment(datasourceId, experimentId, {
    swr: { onSuccess: () => mutate(getListOrganizationExperimentsKey(organizationId)) },
  });

  const handleDelete = async () => {
    await trigger();
    setOpen(false);
  };

  const triggerButton = asDropdownItem ? (
    <DropdownMenu.Item color="red" onClick={() => setOpen(true)}>
      <TrashIcon />
      Delete
    </DropdownMenu.Item>
  ) : (
    <Button color="red" variant="soft" size="1" onClick={() => setOpen(true)}>
      <TrashIcon /> Delete
    </Button>
  );

  return (
    <>
      {triggerButton}

      <Dialog.Root open={open} onOpenChange={setOpen}>
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
    </>
  );
}
