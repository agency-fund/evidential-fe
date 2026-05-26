'use client';
import { Box, Callout, CheckboxCards, Flex, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { useListOrganizationWebhooks } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { XSpinner } from '@/components/ui/x-spinner';
import { WebhooksLogoIcon } from '@phosphor-icons/react';

type SelectWebhooksSectionProps = {
  selectedWebhookIds: string[];
  onWebhookIdsChange: (ids: string[]) => void;
};

export const SelectWebhooksSection = ({ selectedWebhookIds, onWebhookIdsChange }: SelectWebhooksSectionProps) => {
  const org = useCurrentOrganization();
  const organizationId = org?.current.id;

  const { data: webhooksData, isLoading } = useListOrganizationWebhooks(organizationId || '', {
    swr: { enabled: !!organizationId },
  });

  const webhooks = webhooksData?.items ?? [];

  if (isLoading) {
    return <XSpinner />;
  }

  if (webhooks.length === 0) {
    return (
      <Callout.Root color="gray" variant="surface">
        <Callout.Icon>
          <WebhooksLogoIcon />
        </Callout.Icon>
        <Callout.Text>
          Optional: We can send your system a webhook when an experiment is created. Configure your first webhook in{' '}
          <Link href={`/organizations/${organizationId}`} target="_blank" rel="noopener noreferrer">
            Settings
          </Link>
          .
        </Callout.Text>
      </Callout.Root>
    );
  }

  return (
    <Box>
      <Text as="label" size="2" weight="bold" mb="6px">
        Webhooks
      </Text>

      <Flex direction="column" gap="3">
        <Text size="2" color="gray">
          Select which webhooks should receive notifications when this experiment is created.
        </Text>
        <CheckboxCards.Root value={selectedWebhookIds} onValueChange={onWebhookIdsChange} columns="4" gap="3">
          {webhooks.map((webhook) => (
            <CheckboxCards.Item key={webhook.id} value={webhook.id}>
              <Flex direction="column" width="100%">
                <Text weight="bold">{webhook.name}</Text>
                <Text size="2" color="gray">
                  {webhook.url}
                </Text>
              </Flex>
            </CheckboxCards.Item>
          ))}
        </CheckboxCards.Root>
      </Flex>
    </Box>
  );
};
