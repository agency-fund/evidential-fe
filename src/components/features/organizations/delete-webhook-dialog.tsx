'use client';
import { AlertDialog, Button, Flex, IconButton, Text, TextField } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { getListOrganizationWebhooksKey, useDeleteWebhookFromOrganization } from '@/api/admin';
import { mutate } from 'swr';
import { useState } from 'react';

interface DeleteWebhookDialogProps {
  organizationId: string;
  webhookId: string;
}

export function DeleteWebhookDialog({ organizationId, webhookId }: DeleteWebhookDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [open, setOpen] = useState(false);

  const { trigger } = useDeleteWebhookFromOrganization(
    organizationId,
    webhookId,
    { allow_missing: true },
    {
      swr: {
        onSuccess: async () => {
          await mutate(getListOrganizationWebhooksKey(organizationId));
          setOpen(false);
          setConfirmationText('');
        },
      },
    },
  );

  const isConfirmed = confirmationText === 'delete';

  const handleDelete = async () => {
    if (isConfirmed) {
      await trigger();
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger>
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && isConfirmed) {
            e.preventDefault();
            await handleDelete();
          }
        }}
      >
        <AlertDialog.Title>Delete Webhook</AlertDialog.Title>
        <AlertDialog.Description>Are you sure you want to delete this webhook?</AlertDialog.Description>

        <Flex direction={'column'} mt={'4'}>
          <Text as="p" mb={'3'}>
            Please type &apos;delete&apos; in this text box to confirm.
          </Text>
          <TextField.Root
            value={confirmationText}
            autoFocus={true}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="delete"
          />
        </Flex>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color="red"
              disabled={!isConfirmed}
              onClick={async (e) => {
                if (!isConfirmed) {
                  e.preventDefault();
                  return;
                }
                await handleDelete();
              }}
            >
              Delete
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
