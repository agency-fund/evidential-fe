'use client';
import { getListOrganizationWebhooksKey, useAddWebhookToOrganization } from '@/api/admin';
import { useState } from 'react';
import { Box, Button, Card, Code, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { CopyIcon, PlusIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { AddWebhookToOrganizationResponse } from '@/api/methods.schemas';

export function AddWebhookDialog({ organizationId }: { organizationId: string }) {
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
        <Button>
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

            <Flex direction="column" gap="3">
              <Card>
                <Flex direction="column" gap="2">
                  <Text as="div" size="2" weight="bold">
                    Webhook URL
                  </Text>
                  <Flex align="center" gap="2">
                    <Code>{webhookResponse.url}</Code>
                    <Button variant="ghost" size="1" onClick={() => navigator.clipboard.writeText(webhookResponse.url)}>
                      <CopyIcon />
                    </Button>
                  </Flex>
                </Flex>
              </Card>

              <Card>
                <Flex direction="column" gap="2">
                  <Text as="div" size="2" weight="bold">
                    Authentication Token
                  </Text>
                  <Flex align="center" gap="2">
                    <Code>{webhookResponse.auth_token}</Code>
                    <Button
                      variant="ghost"
                      size="1"
                      onClick={() => navigator.clipboard.writeText(webhookResponse.auth_token)}
                    >
                      <CopyIcon />
                    </Button>
                  </Flex>
                </Flex>
              </Card>

              <Box mt="2">
                <Text as="div" size="2" weight="bold">
                  How to Use This Webhook
                </Text>
                <Text as="div" size="2" mt="1">
                  When an experiment is created, we will send a POST request to your URL with:
                </Text>
                <Box my="2">
                  <Text as="div" size="2" weight="bold">
                    Headers:
                  </Text>
                  <Code>
                    Content-Type: application/json
                    <br />
                    Authorization: ${webhookResponse.auth_token}
                  </Code>
                </Box>
                <Box my="2">
                  <Text as="div" size="2" weight="bold">
                    Body:
                  </Text>
                  <Code>
                    {`{
  "experiment_id": "some-experiment-id"
}`}
                  </Code>
                </Box>
                <Text as="div" size="2" color="orange" mt="2">
                  Important: Your endpoint should validate the Authorization header to ensure requests are legitimate.
                  Reject any requests that don't include the exact token shown above.
                </Text>
              </Box>
            </Flex>

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
                  type: 'event.created',
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
