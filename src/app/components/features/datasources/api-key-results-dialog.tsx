import { Dialog, Button, Flex } from '@radix-ui/themes';
import { API_BASE_URL } from '@/services/constants';
import { CodeSnippetCard } from '@/app/components/ui/cards/code-snippet-card';

export const ApiKeyResultsDialog = ({
  createdKey,
  datasourceId,
  isOpen,
  onOpenChange,
}: {
  createdKey: { key: string } | undefined;
  datasourceId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const exampleCurlSnippet =
    createdKey !== undefined
      ? `curl -H "X-API-Key: ${createdKey.key}" -H "Datasource-ID: ${datasourceId}" ${API_BASE_URL}/v1/_authcheck`
      : '';

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>Created API key</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          The API key has been created. It will only be shown once. You can use it to make API calls.
        </Dialog.Description>

        <CodeSnippetCard title="API key" content={createdKey?.key || ''} tooltipContent="Copy API key" />

        <CodeSnippetCard title="Example" content={exampleCurlSnippet} tooltipContent="Copy example" />
        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button>Close</Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
