import { useState } from 'react';
import { useCreateApiKey } from '@/api/admin';
import { isSuccessResponse } from '@/services/typehelper';
import { Button, Code, DataList, Dialog, Flex, IconButton, Spinner } from '@radix-ui/themes';
import { CopyIcon, LockOpen2Icon } from '@radix-ui/react-icons';

export const CreateApiKeyDialog = ({ datasourceId }: { datasourceId: string }) => {
  const [state, setState] = useState<'presenting-form' | 'presenting-results' | 'presenting-button'>(
    'presenting-button',
  );
  const { data: createdKey, trigger: triggerCreateApiKey, isMutating } = useCreateApiKey();

  return (
    <>
      {state === 'presenting-results' && isSuccessResponse(createdKey) && (
        <Dialog.Root
          defaultOpen={true}
          onOpenChange={(open) => setState(open ? 'presenting-results' : 'presenting-button')}
        >
          <Dialog.Content>
            <Dialog.Title>Created API key</Dialog.Title>
            <Dialog.Description>The API key has been created. It will only be shown once.</Dialog.Description>
            <Flex direction="column" gap="3">
              <DataList.Root>
                <DataList.Item>
                  <DataList.Label minWidth="88px">ID</DataList.Label>
                  <DataList.Value>
                    <Code variant="ghost">{createdKey.data.id}</Code>
                  </DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label minWidth="88px">Key</DataList.Label>
                  <DataList.Value>
                    <Flex align="center" gap="2">
                      <Code variant="ghost">{createdKey.data.key}</Code>
                      <IconButton size="1" aria-label="Copy value" color="gray" variant="ghost">
                        <CopyIcon onClick={() => navigator.clipboard.writeText(createdKey.data.key)} />
                      </IconButton>
                    </Flex>
                  </DataList.Value>
                </DataList.Item>
              </DataList.Root>
            </Flex>
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
        <Dialog.Root onOpenChange={(open) => setState(open ? 'presenting-form' : 'presenting-button')}>
          <Dialog.Trigger>
            <Button>
              <LockOpen2Icon /> Create API Key
            </Button>
          </Dialog.Trigger>

          <Dialog.Content>
            {isMutating ? (
              <Spinner />
            ) : (
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
      )}
    </>
  );
};
