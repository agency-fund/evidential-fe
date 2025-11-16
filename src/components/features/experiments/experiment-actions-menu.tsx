'use client';
import { Button, Dialog, DropdownMenu, Flex, IconButton } from '@radix-ui/themes';
import { useState } from 'react';
import { getListOrganizationExperimentsKey, useDeleteExperiment } from '@/api/admin';
import { mutate } from 'swr';
import { DotsVerticalIcon, TrashIcon, EyeOpenIcon, FileTextIcon, DownloadIcon } from '@radix-ui/react-icons';
import { DownloadAssignmentsCsvButton } from '@/components/features/experiments/download-assignments-csv-button';
import Link from 'next/link';

interface ExperimentActionsMenuProps {
  organizationId: string;
  datasourceId: string;
  experimentId: string;
  designUrl?: string;
}

export function ExperimentActionsMenu({
  datasourceId,
  experimentId,
  organizationId,
  designUrl,
}: ExperimentActionsMenuProps) {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
  };

  return (
    <>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger>
          <IconButton variant="ghost" color="gray" size="1">
            <DotsVerticalIcon width="16" height="16" />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" side="bottom">
          <DropdownMenu.Item asChild>
            <Link href={`/datasources/${datasourceId}/experiments/${experimentId}`}>
              <EyeOpenIcon /> View Experiment
            </Link>
          </DropdownMenu.Item>
          <DownloadAssignmentsCsvButton datasourceId={datasourceId} experimentId={experimentId}>
            <DropdownMenu.Item>
              <DownloadIcon /> Download Assignments CSV
            </DropdownMenu.Item>
          </DownloadAssignmentsCsvButton>
          {designUrl && (
            <DropdownMenu.Item asChild>
              <Link href={designUrl} target="_blank" rel="noopener noreferrer">
                <FileTextIcon /> View Design Document
              </Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator />
          <DropdownMenu.Item color="red" onClick={() => setOpen(true)}>
            <TrashIcon /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

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
