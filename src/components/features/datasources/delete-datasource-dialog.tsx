'use client';
import { IconButton } from '@radix-ui/themes';
import { getGetOrganizationKey, useDeleteDatasource } from '@/api/admin';
import { mutate } from 'swr';
import { TrashIcon } from '@radix-ui/react-icons';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';

interface DeleteDatasourceDialogProps {
  organizationId: string;
  datasourceId: string;
}

export function DeleteDatasourceDialog({ organizationId, datasourceId }: DeleteDatasourceDialogProps) {
  const { trigger, isMutating } = useDeleteDatasource(
    organizationId,
    datasourceId,
    { allow_missing: true },
    {
      swr: {
        onSuccess: async () => {
          await mutate(getGetOrganizationKey(organizationId));
        },
      },
    },
  );

  return (
    <DeleteAlertDialog
      title="Delete Datasource"
      description="Are you sure you want to delete this datasource? This action cannot be undone."
      trigger={trigger}
      loading={isMutating}
      renderTrigger={() => (
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      )}
    >
      Deleting a datasource will delete all associated experiments, their arm assignments, draws, contexts, snapshots,
      and API keys.
    </DeleteAlertDialog>
  );
}
