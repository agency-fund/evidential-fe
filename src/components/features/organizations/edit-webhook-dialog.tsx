'use client';

import { Button, Dialog, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { WebhookSummary } from '@/api/methods.schemas';
import { getListOrganizationWebhooksKey, useUpdateOrganizationWebhook } from '@/api/admin';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface EditWebhookDialogProps {
  organizationId: string;
  webhook: WebhookSummary;
}

export function EditWebhookDialog({ organizationId, webhook }: EditWebhookDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(webhook.url);
  const [error, setError] = useState<string | null>(null);

  const {
    trigger,
    isMutating,
    error: apiError,
    reset,
  } = useUpdateOrganizationWebhook(organizationId, webhook.id, {
    swr: {
      onSuccess: async () => {
        // Invalidate the webhooks list cache to refresh the data
        await mutate(getListOrganizationWebhooksKey(organizationId));
        setOpen(false);
      },
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!url.trim()) {
      setError('URL cannot be empty');
      return;
    }

    setError(null);
    await trigger({ url });
    // Note: We don't need a try/catch here as the apiError from useUpdateOrganizationWebhook
    // will be displayed in the GenericErrorCallout
  };

  const handleClose = () => {
    setOpen(false);
    setUrl(webhook.url);
    setError(null);
    reset();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(op) => {
        if (!op) {
          handleClose();
        } else {
          setOpen(op);
        }
      }}
    >
      <Dialog.Trigger>
        <IconButton color="gray" variant="soft">
          <Pencil2Icon />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Updating webhook..." />
        ) : (
          <form onSubmit={handleSubmit}>
            <Dialog.Title>Edit Webhook URL</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Update the URL for this webhook.
            </Dialog.Description>

            {apiError && <GenericErrorCallout title={'Failed to update webhook'} error={apiError} />}

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  URL
                </Text>
                <TextField.Root
                  placeholder="https://your-webhook-endpoint.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
                <Text as="div" size="1" color="gray" mt="1">
                  The URL that will receive webhook notifications.
                </Text>
              </label>

              {error && (
                <Text color="red" size="2">
                  {error}
                </Text>
              )}
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Button variant="soft" color="gray" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">Update</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
