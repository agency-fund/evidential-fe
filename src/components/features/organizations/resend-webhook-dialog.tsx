'use client';
import { AlertDialog, Button, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { ReloadIcon } from '@radix-ui/react-icons';
import { getListOrganizationEventsKey, useResendOrganizationEvent } from '@/api/admin';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface ResendWebhookDialogProps {
  organizationId: string;
  eventId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResendWebhookDialog({ organizationId, eventId, open, onOpenChange }: ResendWebhookDialogProps) {
  const eventsUrl = getListOrganizationEventsKey(organizationId)[0];
  const { trigger, isMutating, error, reset } = useResendOrganizationEvent(organizationId, eventId, {
    swr: {
      onSuccess: async () => {
        await mutate((key) => Array.isArray(key) && key[0] === eventsUrl);
        onOpenChange?.(false);
      },
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
    }
    onOpenChange?.(next);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <Tooltip content="Resend">
        <AlertDialog.Trigger>
          <IconButton variant="soft" color="gray">
            <ReloadIcon />
          </IconButton>
        </AlertDialog.Trigger>
      </Tooltip>
      <AlertDialog.Content>
        <AlertDialog.Title>Resend webhook?</AlertDialog.Title>
        <AlertDialog.Description>
          This will requeue the original webhook request to your server. Your infrastructure may receive multiple events
          for the same experiment.
        </AlertDialog.Description>
        {error ? <GenericErrorCallout title="Failed to resend webhook" error={error} /> : null}
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              loading={isMutating}
              onClick={async (e) => {
                e.preventDefault();
                await trigger({}, { throwOnError: false });
              }}
            >
              Yes, send again.
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
