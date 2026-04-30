'use client';

import { GenericErrorCallout } from '@/components/ui/generic-error';
import { AlertDialog, Button, Flex, Spinner, TextField } from '@radix-ui/themes';
import { s } from 'motion/react-client';
import { useEffect, useState } from 'react';
import { set } from 'zod';

type SetApiKeyAlertDialogProps = {
  trigger: (newApiKey: string) => Promise<void>;
  loading?: boolean;
  error?: Error | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SetApiKeyAlertDialog({ trigger, loading, error, open, onOpenChange }: SetApiKeyAlertDialogProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [errorDismissed, setErrorDismissed] = useState<boolean>(true);

  const handleConfirm = async () => {
    setErrorDismissed(false);
    try {
      await trigger(apiKey);
      setErrorDismissed(true);
      setApiKey('');
      onOpenChange(false);
    } catch {
      // SWR populates the `error` prop; keep dialog open so the user sees it.
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (loading) {
      return;
    }
    setApiKey('');
    onOpenChange(open);
    setErrorDismissed(true);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Content
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && apiKey !== '' && !loading) {
            e.preventDefault();
            await handleConfirm();
          }
        }}
      >
        <AlertDialog.Title>Set Turn.io API Key</AlertDialog.Title>
        <AlertDialog.Description>Copy your API key from Turn.io and paste it below.</AlertDialog.Description>

        <Flex direction={'column'} mt={'4'}>
          <TextField.Root
            value={apiKey}
            autoFocus={true}
            onChange={(e) => {
              setErrorDismissed(true);
              setApiKey(e.target.value.trim());
            }}
            placeholder="your-335-character-api-key"
            type="password"
            disabled={loading}
          />
          {!errorDismissed && error && <GenericErrorCallout title="Error Setting API Key" error={error} />}
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
              disabled={apiKey === '' || loading}
              onClick={async (e) => {
                e.preventDefault();
                if (apiKey === '' || loading) {
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
