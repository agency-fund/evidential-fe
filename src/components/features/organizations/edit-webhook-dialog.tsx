'use client';

import { Button, Dialog, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import { WebhookSummary } from '@/api/methods.schemas';
import { getListOrganizationWebhooksKey, useUpdateOrganizationWebhook } from '@/api/admin';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface EditWebhookDialogProps {
  organizationId: string;
  webhook: WebhookSummary;
}

interface FormFields {
  name: string;
  url: string;
}

const defaultFormData = (webhook: WebhookSummary): FormFields => ({
  name: webhook.name,
  url: webhook.url,
});

export function EditWebhookDialog({ organizationId, webhook }: EditWebhookDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData(webhook));

  const { trigger, isMutating, error, reset } = useUpdateOrganizationWebhook(organizationId, webhook.id, {
    swr: {
      onSuccess: () => {
        handleClose();
        mutate(getListOrganizationWebhooksKey(organizationId));
      },
    },
  });

  useEffect(() => {
    if (open && webhook) {
      setFormData(defaultFormData(webhook));
    }
  }, [open, webhook]);

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await trigger({ name: formData.name, url: formData.url });
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
            <Dialog.Title>Edit Webhook</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Update the name and URL for this webhook.
            </Dialog.Description>

            {error && <GenericErrorCallout title={'Failed to update webhook'} error={error} />}

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Name
                </Text>
                <TextField.Root
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="My webhook name"
                  required
                />
                <Text as="div" size="1" color="gray" mt="1">
                  A user-friendly name to identify this webhook.
                </Text>
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  URL
                </Text>
                <TextField.Root
                  value={formData.url}
                  onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://your-webhook-endpoint.com"
                  required
                />
                <Text as="div" size="1" color="gray" mt="1">
                  The URL that will receive webhook notifications.
                </Text>
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit">Update</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
