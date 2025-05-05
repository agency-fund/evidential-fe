import { useState } from 'react';
import { useCreateApiKey } from '@/api/admin';
import { Button, Dialog, Flex } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { PlusIcon } from '@radix-ui/react-icons';
import { API_BASE_URL } from '@/services/constants';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { CodeSnippetCard } from '@/app/components/cards/code-snippet-card';

export const CreateApiKeyDialog = ({ datasourceId }: { datasourceId: string }) => {
  const [state, setState] = useState<'presenting-form' | 'presenting-results' | 'presenting-button'>(
    'presenting-button',
  );
  const { data: createdKey, trigger: triggerCreateApiKey, isMutating, error, reset } = useCreateApiKey(datasourceId);

  const exampleCurlSnippet =
    createdKey !== undefined
      ? `curl -H "X-API-Key: ${createdKey.key}" -H "Datasource-ID: ${datasourceId}" ${API_BASE_URL}/v1/_authcheck`
      : '';
  return (
    <>
      {state === 'presenting-results' && createdKey !== undefined && (
        <Dialog.Root
          defaultOpen={true}
          onOpenChange={(open) => setState(open ? 'presenting-results' : 'presenting-button')}
        >
          <Dialog.Content>
            <Dialog.Title>Created API key</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              The API key has been created. It will only be shown once. You can use it to make API calls.
            </Dialog.Description>

            <CodeSnippetCard title="API key" content={createdKey.key} tooltipContent="Copy API key" />

            <CodeSnippetCard title="Example" content={exampleCurlSnippet} tooltipContent="Copy example" />
            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Close
                </Button>
              </Dialog.Close>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
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
                      await triggerCreateApiKey();
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
