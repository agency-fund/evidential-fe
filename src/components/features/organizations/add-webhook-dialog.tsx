'use client';
import { getListOrganizationWebhooksKey, useAddWebhookToOrganization } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { AddWebhookToOrganizationResponse } from '@/api/methods.schemas';
import { WebhookInfoContent } from '@/components/features/organizations/webhook-info-content';

interface FormFields {
  name: string;
  url: string;
}

const defaultFormData = (): FormFields => ({
  name: '',
  url: '',
});

interface AddWebhookDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddWebhookDialog({ organizationId, open, onOpenChange }: AddWebhookDialogProps) {
  const [formData, setFormData] = useState(defaultFormData());
  const [webhookCreated, setWebhookCreated] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<AddWebhookToOrganizationResponse | null>(null);

  const { trigger, isMutating, error, reset } = useAddWebhookToOrganization(organizationId, {
    swr: { onSuccess: () => mutate(getListOrganizationWebhooksKey(organizationId)) },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await trigger({
        type: 'experiment.created',
        name: formData.name,
        url: formData.url,
      });
      setWebhookResponse(response);
      setWebhookCreated(true);
    } catch (e) {
      console.error('Failed to create webhook:', e);
    }
  };

  const handleClose = () => {
    setFormData(defaultFormData());
    onOpenChange(false);
    setWebhookCreated(false);
    setWebhookResponse(null);
    reset();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(op) => {
        if (!op) {
          handleClose();
        } else {
          onOpenChange(op);
        }
      }}
    >
      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Adding webhook..." />
        ) : webhookCreated && webhookResponse ? (
          <>
            <Dialog.Title>Webhook Created: {webhookResponse.name}</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Your webhook has been created. Please save the following information.
            </Dialog.Description>

            <WebhookInfoContent
              webhook={{
                id: webhookResponse.id,
                type: webhookResponse.type,
                name: webhookResponse.name,
                url: webhookResponse.url,
                auth_token: webhookResponse.auth_token,
              }}
            />

            <Flex gap="3" mt="4" justify="end">
              <Button onClick={handleClose}>Close</Button>
            </Flex>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <Dialog.Title>Add Webhook</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Add a webhook to receive notifications when events occur in this organization.
            </Dialog.Description>

            {error && <GenericErrorCallout title={'Failed to add webhook'} error={error} />}

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
                  type="url"
                  placeholder="https://your-webhook-endpoint.com/path"
                  required
                />
                <Text as="div" size="1" color="gray" mt="1">
                  The URL you wish to receive a POST request every time an experiment is created.
                </Text>
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit">Create</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
