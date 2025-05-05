import { useState, useEffect } from 'react';
import { getListApiKeysKey, useCreateApiKey } from '@/api/admin';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { PlusIcon } from '@radix-ui/react-icons';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { ApiKeyResultsDialog } from './api-key-results-dialog';
import { mutate } from 'swr';

export const CreateApiKeyDialog = ({
  datasourceId,
  onKeyCreated,
}: {
  datasourceId: string;
  onKeyCreated?: (key: { key: string }) => void;
}) => {
  const [state, setState] = useState<'presenting-form' | 'presenting-results' | 'presenting-button'>(
    'presenting-button',
  );
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

  return (
    <>
      {state === 'presenting-results' && createdKey !== undefined && !onKeyCreated && (
        <ApiKeyResultsDialog
          createdKey={createdKey}
          datasourceId={datasourceId}
          isOpen={true}
          onOpenChange={(open) => setState(open ? 'presenting-results' : 'presenting-button')}
        />
      )}

      {(state === 'presenting-form' || state == 'presenting-button') && (
        <>
          <Dialog.Root onOpenChange={(open) => setState(open ? 'presenting-form' : 'presenting-button')}>
            <Dialog.Trigger>
              <Button>
                <PlusIcon /> Create API Key
              </Button>
            </Dialog.Trigger>

            <Dialog.Content>
              {isMutating ? (
                <XSpinner message="Creating API key..." />
              ) : (
                <>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const response = await triggerCreateApiKey();
                      if (onKeyCreated) {
                        onKeyCreated({ key: response.key });
                      }
                      setState('presenting-results');
                    }}
                  >
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
                      <Dialog.Close onClick={() => reset()}>
                        <Button variant="soft" color="gray">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button type="submit">Create</Button>
                    </Flex>
                  </form>
                </>
              )}
            </Dialog.Content>
          </Dialog.Root>
        </>
      )}
    </>
  );
};
