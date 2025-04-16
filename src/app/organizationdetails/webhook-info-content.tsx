'use client';
import { Box, Button, Card, Code, Flex, Text } from '@radix-ui/themes';
import { CopyIcon } from '@radix-ui/react-icons';
import { WebhookSummary } from '@/api/methods.schemas';

export function WebhookInfoContent({ webhook }: { webhook: WebhookSummary }) {
  return (
    <Flex direction="column" gap="3">
      <Card>
        <Flex direction="column" gap="2">
          <Text as="div" size="2" weight="bold">
            Webhook URL
          </Text>
          <Flex align="center" gap="2">
            <Code>{webhook.url}</Code>
            <Button variant="ghost" size="1" onClick={() => navigator.clipboard.writeText(webhook.url)}>
              <CopyIcon />
            </Button>
          </Flex>
        </Flex>
      </Card>

      {webhook.auth_token && (
        <Card>
          <Flex direction="column" gap="2">
            <Text as="div" size="2" weight="bold">
              Authentication Token
            </Text>
            <Flex align="center" gap="2">
              <Code>{webhook.auth_token}</Code>
              <Button variant="ghost" size="1" onClick={() => navigator.clipboard.writeText(webhook.auth_token || '')}>
                <CopyIcon />
              </Button>
            </Flex>
          </Flex>
        </Card>
      )}

      <Box mt="2">
        <Text as="div" size="2" weight="bold">
          How to Use This Webhook
        </Text>
        <Text as="div" size="2" mt="1">
          When an experiment is created, we will send a POST request to your URL with:
        </Text>
        <Box my="2">
          <Text as="div" size="2" weight="bold">
            Headers:
          </Text>
          <Code>
            {`Content-Type: application/json
Authorization: ${webhook.auth_token || '[auth token]'}`}
          </Code>
        </Box>
        <Box my="2">
          <Text as="div" size="2" weight="bold">
            Body:
          </Text>
          <Code>
            {`{
  "experiment_id": "some-experiment-id"
}`}
          </Code>
        </Box>
        <Text as="div" size="2" color="orange" mt="2">
          Important: Your endpoint should validate the Authorization header to ensure requests are legitimate. Reject
          any requests that don't include the exact token shown above.
        </Text>
      </Box>
    </Flex>
  );
}
