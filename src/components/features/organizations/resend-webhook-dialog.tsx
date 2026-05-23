'use client';
import { AlertDialog, Button, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { ReloadIcon } from '@radix-ui/react-icons';
import { getListOrganizationEventsKey, useResendOrganizationEvent } from '@/api/admin';
import { mutate } from 'swr';

interface ResendWebhookDialogProps {
  organizationId: string;
  eventId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResendWebhookDialog({ organizationId, eventId, open, onOpenChange }: ResendWebhookDialogProps) {
  const eventsUrl = getListOrganizationEventsKey(organizationId)[0];
  const { trigger, isMutating } = useResendOrganizationEvent(organizationId, eventId, {
    swr: {
      onSuccess: () => mutate((key) => Array.isArray(key) && key[0] === eventsUrl),
    },
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Trigger>
        <Tooltip content="Resend">
          <IconButton variant="soft" color="gray">
            <ReloadIcon />
          </IconButton>
        </Tooltip>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Title>Resend webhook?</AlertDialog.Title>
        <AlertDialog.Description>
          This will requeue the original webhook request to your server. Your infrastructure may receive multiple events
          for the same experiment if a previous attempt actually succeeded.
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button variant="solid" loading={isMutating} onClick={async () => await trigger({})}>
              Yes, send again.
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
