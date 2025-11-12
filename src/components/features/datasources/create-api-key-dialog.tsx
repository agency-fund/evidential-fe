'use client';

import { useState } from 'react';
import { getListApiKeysKey, useCreateApiKey } from '@/api/admin';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ApiKeyResultsContent } from './api-key-results-content';
import { mutate } from 'swr';

export const CreateApiKeyDialog = ({
  datasourceId,
  open,
  onOpenChange,
}: {
  datasourceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const [showResults, setShowResults] = useState(false);
  const {
    data: createdKey,
    trigger: triggerCreateApiKey,
    isMutating,
    error,
    reset,
  } = useCreateApiKey(datasourceId, {
    swr: {
      onSuccess: () => mutate(getListApiKeysKey(datasourceId)),
    },
  });

  const handleCreate = async () => {
    await triggerCreateApiKey();
    setShowResults(true);
  };

  const handleClose = () => {
    setShowResults(false);
    reset();
    onOpenChange(false);
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
      <Dialog.Content
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isMutating) {
            e.preventDefault();
            handleCreate();
          }
        }}
      >
        {isMutating ? (
          <XSpinner message="Creating API key..." />
        ) : showResults && createdKey ? (
          <>
            <Dialog.Title>Created API key</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              The API key has been created. It will only be shown once. You can use it to make API calls.
            </Dialog.Description>

            <ApiKeyResultsContent createdKey={createdKey} datasourceId={datasourceId} />

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button>Close</Button>
              </Dialog.Close>
            </Flex>
          </>
        ) : (
          <>
            <Dialog.Title>Create API key</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Create a new API key for this datasource.
            </Dialog.Description>

            {error && (
              <GenericErrorCallout
                title={'There was a problem creating the API key. Please try again.'}
                error={error}
              />
            )}

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button onClick={handleCreate}>Create</Button>
            </Flex>
          </>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};
