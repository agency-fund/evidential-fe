'use client';
import { AlertDialog, Button, Flex, IconButton } from '@radix-ui/themes';
import { LockClosedIcon } from '@radix-ui/react-icons';
import { getListOrganizationWebhooksKey, useRegenerateWebhookAuthToken } from '@/api/admin';
import { mutate } from 'swr';

interface RegenerateWebhookAuthDialogProps {
  organizationId: string;
  webhookId: string;
}

export function RegenerateWebhookAuthDialog({ organizationId, webhookId }: RegenerateWebhookAuthDialogProps) {
  const { trigger } = useRegenerateWebhookAuthToken(organizationId, webhookId, {
    swr: {
      onSuccess: () => mutate(getListOrganizationWebhooksKey(organizationId)),
    },
  });

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <IconButton color="blue" variant="soft">
          <LockClosedIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Regenerate Auth Token</AlertDialog.Title>
        <AlertDialog.Description>
          The new auth token will take effect immediately. Are you sure you wish to replace the existing auth token?
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button variant="solid" color="blue" onClick={async () => await trigger({})}>
              Regenerate
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
