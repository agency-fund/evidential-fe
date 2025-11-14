'use client';

import { Flex } from '@radix-ui/themes';
import { API_BASE_URL } from '@/services/constants';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';

export const ApiKeyResultsContent = ({
  createdKey,
  datasourceId,
}: {
  createdKey: { key: string } | undefined;
  datasourceId: string;
}) => {
  const exampleCurlSnippet =
    createdKey !== undefined
      ? `curl -H "X-API-Key: ${createdKey.key}" -i -H "Datasource-ID: ${datasourceId}" ${API_BASE_URL}/v1/experiments`
      : '';

  return (
    <Flex direction="column" gap="3">
      <CodeSnippetCard title="API key" content={createdKey?.key || ''} tooltipContent="Copy API key" />
      <CodeSnippetCard title="Example" content={exampleCurlSnippet} tooltipContent="Copy example" />
    </Flex>
  );
};
