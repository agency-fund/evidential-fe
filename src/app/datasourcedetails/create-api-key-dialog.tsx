import { useState } from 'react';
import { useCreateApiKey } from '@/api/admin';
import { Button, Code, DataList, Dialog, Flex, IconButton } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { CopyIcon, PlusIcon } from '@radix-ui/react-icons';
import { API_BASE_URL } from '@/services/constants';
import { GenericErrorCallout } from '@/app/components/generic-error';

export const CreateApiKeyDialog = ({ datasourceId }: { datasourceId: string }) => {
  const [state, setState] = useState<'presenting-form' | 'presenting-results' | 'presenting-button'>(
    'presenting-button',
  );
  const { data: createdKey, trigger: triggerCreateApiKey, isMutating, error, reset } = useCreateApiKey();

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
            <DataList.Root>
              <DataList.Item>
                <DataList.Label minWidth="88px">Key</DataList.Label>
                <DataList.Value>
                  <Flex align="center" gap="2">
                    <Code variant="ghost">{createdKey.key}</Code>
                    <IconButton size="1" aria-label="Copy value" color="gray" variant="ghost">
                      <CopyIcon onClick={() => navigator.clipboard.writeText(createdKey.key)} />
                    </IconButton>
                  </Flex>
                </DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Example</DataList.Label>
                <DataList.Value>
                  {/* TODO: replace with a more useful API call */}
                  <Flex align={'center'} gap={'2'}>
                    <Code variant="ghost">{exampleCurlSnippet}</Code>
                    <IconButton size="1" aria-label="Copy value" color="gray" variant="ghost">
                      <CopyIcon onClick={() => navigator.clipboard.writeText(exampleCurlSnippet)} />
                    </IconButton>
                  </Flex>
                </DataList.Value>
              </DataList.Item>
            </DataList.Root>
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
                      await triggerCreateApiKey({
                        datasource_id: datasourceId,
                      });
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
