'use client';
import { AlertDialog, Button, Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { useDeleteDatasource } from '@/api/admin';
import { mutate } from 'swr';

interface DeleteDatasourceDialogProps {
  organizationId: string;
  datasourceId: string;
}

export function DeleteDatasourceDialog({ organizationId, datasourceId }: DeleteDatasourceDialogProps) {
  const { trigger } = useDeleteDatasource(datasourceId);

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Delete Datasource</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to delete this datasource? This action cannot be undone.
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
                await mutate([`/v1/m/organizations/${organizationId}`]);
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
