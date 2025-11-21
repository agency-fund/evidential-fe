'use client';
import { DropdownMenu, IconButton } from '@radix-ui/themes';
import { useState } from 'react';
import { getListOrganizationExperimentsKey, useDeleteExperiment } from '@/api/admin';
import { mutate } from 'swr';
import { DotsVerticalIcon, TrashIcon } from '@radix-ui/react-icons';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';

interface ExperimentActionsMenuProps {
  organizationId: string;
  datasourceId: string;
  experimentId: string;
}

export function ExperimentActionsMenu({ datasourceId, experimentId, organizationId }: ExperimentActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { trigger, isMutating } = useDeleteExperiment(
    datasourceId,
    experimentId,
    { allow_missing: true },
    {
      swr: {
        onSuccess: async () => {
          await mutate(getListOrganizationExperimentsKey(organizationId));
        },
      },
    },
  );

  return (
    <>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger>
          <IconButton variant="ghost" color="gray" size="1">
            <DotsVerticalIcon width="16" height="16" />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" side="bottom">
          <DropdownMenu.Item color="red" onClick={() => setDeleteDialogOpen(true)}>
            <TrashIcon /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <DeleteAlertDialog
        title="Delete Experiment"
        description="Are you sure you want to delete this experiment? This action cannot be undone."
        trigger={trigger}
        loading={isMutating}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        Deleting an experiment will delete all associated assignments, state, and snapshots.
      </DeleteAlertDialog>
    </>
  );
}
