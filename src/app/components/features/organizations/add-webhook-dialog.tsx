'use client';
import { getListOrganizationWebhooksKey, useAddWebhookToOrganization } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/app/components/ui/x-spinner';
import { PlusIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/app/components/ui/generic-error';
import { AddWebhookToOrganizationResponse } from '@/api/methods.schemas';
import { WebhookInfoContent } from '@/app/components/features/organizations/webhook-info-content';

export function AddWebhookDialog({ organizationId, disabled = false }: { organizationId: string; disabled?: boolean }) {
  const { trigger, isMutating, error, reset } = useAddWebhookToOrganization(organizationId, {
    swr: { onSuccess: () => mutate(getListOrganizationWebhooksKey(organizationId)) },
  });
  const [open, setOpen] = useState(false);
  const [webhookCreated, setWebhookCreated] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<AddWebhookToOrganizationResponse | null>(null);

  const handleClose = () => {
    setOpen(false);
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
          setOpen(op);
        }
      }}
    >
      <Dialog.Trigger>
        <Button disabled={disabled}>
          <PlusIcon />
          Add Webhook
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Adding webhook..." />
        ) : webhookCreated && webhookResponse ? (
          <>
            <Dialog.Title>Webhook Created Successfully</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Your webhook has been created. Please save the following information.
            </Dialog.Description>

            <WebhookInfoContent
              webhook={{
                id: webhookResponse.id,
                type: webhookResponse.type,
                url: webhookResponse.url,
                auth_token: webhookResponse.auth_token,
              }}
            />

            <Flex gap="3" mt="4" justify="end">
              <Button onClick={handleClose}>Close</Button>
            </Flex>
          </>
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              const url = fd.get('url') as string;
              try {
                const response = await trigger({
                  type: 'experiment.created',
                  url,
                });
                setWebhookResponse(response);
                setWebhookCreated(true);
              } catch (e) {
                console.error('Failed to create webhook:', e);
              }
            }}
          >
            <Dialog.Title>Add Webhook</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Add a webhook to receive notifications when events occur in this organization.
            </Dialog.Description>

            {error && <GenericErrorCallout title={'Failed to add webhook'} error={error} />}

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  URL
                </Text>
                <TextField.Root
                  name="url"
                  type="url"
                  placeholder="https://your-webhook-endpoint.com/path"
                  required
                ></TextField.Root>
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
