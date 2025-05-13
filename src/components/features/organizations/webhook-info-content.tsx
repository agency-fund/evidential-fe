'use client';
import { Box, Flex, Text } from '@radix-ui/themes';
import { WebhookSummary } from '@/api/methods.schemas';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';

export function WebhookInfoContent({ webhook }: { webhook: WebhookSummary }) {
  const webHookBody = JSON.stringify(
    {
      datasource_id: 'datasource-id',
      organization_id: 'organization-id',
      experiment_id: 'some-experiment-id',
      experiment_url: 'https://...',
    },
    null,
    2,
  );

  const webHookHeaders = `Content-Type: application/json \nAuthorization: ${webhook.auth_token || '[auth token]'}`;

  return (
    <Flex direction="column" gap="3">
      {webhook.url && <CodeSnippetCard title="Webhook URL" content={webhook.url} />}

      {webhook.auth_token && <CodeSnippetCard title="Authentication Token" content={webhook.auth_token} />}

      <Box my="2">
        <Text as="div" size="2" mt="1">
          When an experiment is created, we will send a POST request to your URL with:
        </Text>

        <CodeSnippetCard title="Headers" content={webHookHeaders} tooltipContent="Copy headers" />

        <CodeSnippetCard title="Body" content={webHookBody} tooltipContent="Copy body" />

        <Text as="div" size="2" color="orange" mt="2">
          Important: Your endpoint should validate the Authorization header to ensure requests are legitimate. Reject
          any requests that do not include the exact token shown above.
        </Text>
      </Box>
    </Flex>
  );
}
