'use client';
import { useState } from 'react';
import { DropdownMenu, IconButton } from '@radix-ui/themes';
import { DotsVerticalIcon, TrashIcon } from '@radix-ui/react-icons';
import { DeleteExperimentDialog } from '@/components/features/experiments/delete-experiment-dialog';

interface ExperimentActionsMenuProps {
  organizationId: string;
  datasourceId: string;
  experimentId: string;
  experimentName?: string;
}

export function ExperimentActionsMenu({
  datasourceId,
  experimentId,
  organizationId,
  experimentName,
}: ExperimentActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

      <DeleteExperimentDialog
        organizationId={organizationId}
        datasourceId={datasourceId}
        experimentId={experimentId}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        experimentName={experimentName}
      />
    </>
  );
}
