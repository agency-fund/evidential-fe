'use client';
import { Callout, Flex, Text } from '@radix-ui/themes';
import { WebhookSummary } from '@/api/methods.schemas';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { InfoCircledIcon } from '@radix-ui/react-icons';

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

  const webHookHeaders = `Content-Type: application/json\nWebhook-Token: ${webhook.auth_token || '[auth token]'}`;

  return (
    <Flex direction="column" gap="3">
      {webhook.url && <CodeSnippetCard title="Webhook URL" content={webhook.url} />}
      {webhook.auth_token && <CodeSnippetCard title="Authentication Token" content={webhook.auth_token} />}
      <Text as="div" size="2" mt="1">
        When an experiment is created, we will send a POST request to your URL with:
      </Text>
      <CodeSnippetCard title="Headers" content={webHookHeaders} tooltipContent="Copy headers" />
      <CodeSnippetCard title="Body" content={webHookBody} tooltipContent="Copy body" />
      <Callout.Root variant={'soft'} size={'1'} color={'orange'}>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>Security Tip: Reject any requests that do not have the exact token shown above.</Callout.Text>
      </Callout.Root>
    </Flex>
  );
}
