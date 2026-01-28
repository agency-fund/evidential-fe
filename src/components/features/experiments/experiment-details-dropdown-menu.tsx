'use client';
import { useState } from 'react';
import { AlertDialog, Button, Callout, Checkbox, DropdownMenu, Flex, IconButton, Text } from '@radix-ui/themes';
import { DotsVerticalIcon, TrashIcon } from '@radix-ui/react-icons';
import { getGetExperimentForUiKey, useDeleteExperimentData } from '@/api/admin';
import { DeleteExperimentDataRequest } from '@/api/methods.schemas';
import { mutate } from 'swr';
import { useAuth } from '@/providers/auth-provider';

interface ExperimentDetailsDropdownMenuProps {
  datasourceId: string;
  experimentId: string;
}

export function ExperimentDetailsDropdownMenu({ datasourceId, experimentId }: ExperimentDetailsDropdownMenuProps) {
  const [deleteDataDialogOpen, setDeleteDataDialogOpen] = useState(false);
  const [deleteDataRequest, setDeleteDataRequest] = useState<DeleteExperimentDataRequest>({});
  const [deleteDataSuccess, setDeleteDataSuccess] = useState(false);
  const auth = useAuth();

  const {
    trigger: deleteExperimentData,
    isMutating: isDeletingData,
    error: deleteExperimentDataError,
    reset: deleteExperimentDataReset,
  } = useDeleteExperimentData(datasourceId, experimentId, {
    swr: {
      onSuccess: async () => {
        setDeleteDataSuccess(true);
        await mutate(getGetExperimentForUiKey(datasourceId, experimentId));
      },
    },
  });

  const handleDeleteData = async () => {
    await deleteExperimentData(deleteDataRequest);
  };

  // Only show dangerous options to privileged users.
  if (!auth.isAuthenticated || !auth.isPrivileged) {
    return <></>;
  }

  return (
    <>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger>
          <IconButton variant="ghost" color="gray" size="1">
            <DotsVerticalIcon width="16" height="16" />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" side="bottom">
          <DropdownMenu.Item color="red" onClick={() => setDeleteDataDialogOpen(true)}>
            <TrashIcon /> Delete Data
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>

      <AlertDialog.Root
        open={deleteDataDialogOpen}
        onOpenChange={(open) => {
          setDeleteDataDialogOpen(open);
          if (!open) {
            setDeleteDataSuccess(false);
            setDeleteDataRequest({});
            deleteExperimentDataReset();
          }
        }}
      >
        <AlertDialog.Content>
          <AlertDialog.Title>Delete Experiment Data</AlertDialog.Title>
          <AlertDialog.Description>Select which data to delete for this experiment:</AlertDialog.Description>

          {!deleteDataSuccess && (
            <Flex direction="column" gap="3" my="4">
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox
                    checked={!!deleteDataRequest.assignments}
                    onCheckedChange={(checked) => setDeleteDataRequest((prev) => ({ ...prev, assignments: !!checked }))}
                  />
                  Assignments - Delete all arm assignments
                </Flex>
              </Text>
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox
                    checked={!!deleteDataRequest.draws}
                    onCheckedChange={(checked) => setDeleteDataRequest((prev) => ({ ...prev, draws: !!checked }))}
                  />
                  Draws - Delete all draws
                </Flex>
              </Text>
              <Text as="label" size="2">
                <Flex gap="2" align="center">
                  <Checkbox
                    checked={!!deleteDataRequest.snapshots}
                    onCheckedChange={(checked) => setDeleteDataRequest((prev) => ({ ...prev, snapshots: !!checked }))}
                  />
                  Snapshots - Delete all analysis snapshots
                </Flex>
              </Text>
            </Flex>
          )}

          {deleteDataSuccess && (
            <Callout.Root color="green" my="4">
              <Callout.Text>Data deleted successfully.</Callout.Text>
            </Callout.Root>
          )}

          {deleteExperimentDataError && (
            <Callout.Root color="red" my="4">
              <Callout.Text>Error: {deleteExperimentDataError.message}</Callout.Text>
            </Callout.Root>
          )}

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">
                {!deleteDataSuccess ? 'Cancel' : 'Close'}
              </Button>
            </AlertDialog.Cancel>
            {!deleteDataSuccess && (
              <Button
                variant="solid"
                color="red"
                disabled={!deleteDataRequest.assignments && !deleteDataRequest.draws && !deleteDataRequest.snapshots}
                loading={isDeletingData}
                onClick={handleDeleteData}
              >
                Delete
              </Button>
            )}
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </>
  );
}
