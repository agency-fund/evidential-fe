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

  const { trigger, isMutating, error, reset } = useUpdateOrganizationWebhook(organizationId, webhook.id, {
    swr: {
      onSuccess: () => mutate(getListOrganizationWebhooksKey(organizationId)),
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget as HTMLFormElement);
    const newName = fd.get('name') as string;
    const newUrl = fd.get('url') as string;
    await trigger({ name: newName, url: newUrl });
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
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
                <TextField.Root name="name" placeholder="My webhook name" defaultValue={webhook.name} required />
                <Text as="div" size="1" color="gray" mt="1">
                  A user-friendly name to identify this webhook.
                </Text>
              </label>
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  URL
                </Text>
                <TextField.Root
                  name="url"
                  placeholder="https://your-webhook-endpoint.com"
                  defaultValue={webhook.url}
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
