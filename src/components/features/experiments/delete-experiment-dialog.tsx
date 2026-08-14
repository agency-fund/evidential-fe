'use client';
import { mutate } from 'swr';
import { getListOrganizationExperimentsKey, useDeleteExperiment } from '@/api/admin';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';

const DELETE_DESCRIPTION = 'Are you sure you want to delete this experiment? This action cannot be undone.';
const DELETE_WARNING = 'Deleting an experiment will delete all associated assignments, state, and snapshots.';

type DeleteExperimentDialogProps = {
  organizationId: string;
  datasourceId: string;
  experimentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeleteExperimentDialog(props: DeleteExperimentDialogProps) {
  const { organizationId, datasourceId, experimentId, open, onOpenChange } = props;
  const { trigger, isMutating } = useDeleteExperiment(
    datasourceId,
    experimentId,
    { allow_missing: true },
    {
      swr: {
        onSuccess: () => mutate(getListOrganizationExperimentsKey(organizationId)),
      },
    },
  );

  return (
    <DeleteAlertDialog
      title="Delete Experiment"
      description={DELETE_DESCRIPTION}
      trigger={trigger}
      loading={isMutating}
      open={open}
      onOpenChange={onOpenChange}
    >
      {DELETE_WARNING}
    </DeleteAlertDialog>
  );
}
