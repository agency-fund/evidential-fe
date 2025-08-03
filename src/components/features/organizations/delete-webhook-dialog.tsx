'use client';
import { AlertDialog, Button, Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { getListOrganizationWebhooksKey, useDeleteWebhookFromOrganization } from '@/api/admin';
import { mutate } from 'swr';

interface DeleteWebhookDialogProps {
  organizationId: string;
  webhookId: string;
}

export function DeleteWebhookDialog({ organizationId, webhookId }: DeleteWebhookDialogProps) {
  const { trigger } = useDeleteWebhookFromOrganization(
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
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Delete Webhook</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to delete this webhook? This action cannot be undone.
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
              }}
            >
              Delete
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
