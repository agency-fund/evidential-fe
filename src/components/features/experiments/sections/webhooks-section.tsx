'use client';

import { DataList, Flex, Text } from '@radix-ui/themes';
import { useListOrganizationWebhooks } from '@/api/admin';
import { SectionCard } from '@/components/ui/cards/section-card';
import { XSpinner } from '@/components/ui/x-spinner';
import { useCurrentOrganization } from '@/providers/organization-provider';

interface WebhooksSectionProps {
  webhookIds: string[];
}

export function WebhooksSection({ webhookIds }: WebhooksSectionProps) {
  const org = useCurrentOrganization();
  const organizationId = org?.current.id ?? '';
  const { data: webhooksData, isLoading: loadingWebhooks } = useListOrganizationWebhooks(organizationId, {
    swr: { enabled: !!organizationId && webhookIds.length > 0 },
  });

  const selectedWebhooks = webhooksData?.items?.filter((webhook) => webhookIds.includes(webhook.id)) ?? [];
  const selectedWebhookIds = new Set(selectedWebhooks.map((webhook) => webhook.id));
  const missingWebhookIds = webhookIds.filter((webhookId) => !selectedWebhookIds.has(webhookId));

  if (webhookIds.length === 0) {
    return null;
  }

  return (
    <SectionCard title="Webhook Configuration">
      <DataList.Root>
        <DataList.Item>
          <DataList.Label>Configured Webhooks</DataList.Label>
          <DataList.Value>
            <Flex direction="column" gap="2">
              {loadingWebhooks && <XSpinner />}
              {selectedWebhooks.map((webhook) => (
                <Flex key={webhook.id} direction="column" gap="1">
                  <Text weight="bold">{webhook.name}</Text>
                  <Text size="2" color="gray">
                    {webhook.url}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </DataList.Value>
          {missingWebhookIds.length ? (
            <>
              <DataList.Label>Missing Webhooks</DataList.Label>
              <DataList.Value>
                {missingWebhookIds.map((webhookId) => (
                  <Text key={webhookId} size="2" color="gray">
                    {webhookId}
                  </Text>
                ))}
              </DataList.Value>
            </>
          ) : null}
        </DataList.Item>
      </DataList.Root>
    </SectionCard>
  );
}
