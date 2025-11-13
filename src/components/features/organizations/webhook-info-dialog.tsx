'use client';
import { Button, Dialog, Flex, IconButton } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { WebhookSummary } from '@/api/methods.schemas';
import { useState } from 'react';
import { WebhookInfoContent } from '@/components/features/organizations/webhook-info-content';

export function WebhookInfoDialog({ webhook }: { webhook: WebhookSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <IconButton color="gray" variant="soft">
          <InfoCircledIcon />
        </IconButton>
      </Dialog.Trigger>

      <Dialog.Content
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setOpen(false);
          }
        }}
      >
        <Dialog.Title>Webhook Information</Dialog.Title>
        <Dialog.Description size="2" mb="2">
          Details about your webhook and how to use it.
        </Dialog.Description>

        <WebhookInfoContent webhook={webhook} />

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button>Close</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
