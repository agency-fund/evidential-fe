'use client';
import { IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { getListOrganizationWebhooksKey, useDeleteWebhookFromOrganization } from '@/api/admin';
import { mutate } from 'swr';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';

interface DeleteWebhookDialogProps {
  organizationId: string;
  webhookId: string;
}

export function DeleteWebhookDialog({ organizationId, webhookId }: DeleteWebhookDialogProps) {
  const { trigger, isMutating } = useDeleteWebhookFromOrganization(
    organizationId,
    webhookId,
    { allow_missing: true },
    {
      swr: {
        onSuccess: () => mutate(getListOrganizationWebhooksKey(organizationId)),
      },
    },
  );

  return (
    <DeleteAlertDialog
      title="Delete Webhook"
      description="Are you sure you want to delete this webhook?"
      trigger={trigger}
      loading={isMutating}
      renderTrigger={() => (
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      )}
    />
  );
}
