'use client';

import { AlertDialog, Button, Flex, Spinner, TextField } from '@radix-ui/themes';
import { useEffect, useState } from 'react';

type SetApiKeyAlertDialogProps = {
  trigger: (newApiKey: string) => Promise<void>;
  loading?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SetApiKeyAlertDialog({
  trigger,
  loading,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SetApiKeyAlertDialogProps) {
  const [confirmation, setConfirmation] = useState<{ dialog: 'closed' } | { dialog: 'open'; text: string }>({
    dialog: 'closed',
  });

  useEffect(() => {
    if (controlledOpen && confirmation.dialog === 'closed') {
      setConfirmation({ dialog: 'open', text: '' });
    } else if (!controlledOpen && confirmation.dialog === 'open') {
      setConfirmation({ dialog: 'closed' });
    }
  }, [controlledOpen, confirmation.dialog]);

  const isOpen = controlledOpen;
  const isConfirmed = confirmation.dialog === 'open' && confirmation.text !== '';

  const handleConfirm = async () => {
    const apiKey = confirmation.dialog === 'open' ? confirmation.text : '';
    try {
      await trigger(apiKey);
    } finally {
      setConfirmation({ dialog: 'closed' });
      controlledOnOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (loading) {
      return;
    }
    controlledOnOpenChange(open);
    if (open) {
      setConfirmation({ dialog: 'open', text: '' });
    } else {
      setConfirmation({ dialog: 'closed' });
    }
  };

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialog.Content
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && isConfirmed && !loading) {
            e.preventDefault();
            await handleConfirm();
          }
        }}
      >
        <AlertDialog.Title>Set Turn.io API Key</AlertDialog.Title>
        <AlertDialog.Description>Copy your API key from Turn.io and paste it below.</AlertDialog.Description>

        <Flex direction={'column'} mt={'4'}>
          <TextField.Root
            value={confirmation.dialog === 'open' ? confirmation.text : ''}
            autoFocus={true}
            onChange={(e) => setConfirmation({ dialog: 'open', text: e.target.value })}
            placeholder="your-335-character-api-key"
            type="password"
            disabled={loading}
          />
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" disabled={loading}>
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color="blue"
              disabled={!isConfirmed || loading}
              onClick={async (e) => {
                e.preventDefault();
                if (!isConfirmed || loading) {
                  return;
                }
                await handleConfirm();
              }}
            >
              {loading ? <Spinner /> : 'Set API Key'}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
