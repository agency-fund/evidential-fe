'use client';
import { Card, Flex, Grid, Spinner, Text } from '@radix-ui/themes';
import { useListOrganizationWebhooks } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { SectionCard } from '@/components/ui/cards/section-card';

interface ListSelectedWebhooksCardProps {
  webhookIds: string[];
}

export function ListSelectedWebhooksCard({ webhookIds }: ListSelectedWebhooksCardProps) {
  const org = useCurrentOrganization();
  const organizationId = org?.current.id;
  const { data: webhooksData, isLoading: loadingWebhooks } = useListOrganizationWebhooks(organizationId || '', {
    swr: {
      enabled: !!organizationId,
    },
  });

  if (loadingWebhooks) {
    return (
      <SectionCard title="Selected Webhooks">
        <Flex justify="center" py="4">
          <Spinner />
        </Flex>
      </SectionCard>
    );
  }

  if (!webhookIds || webhookIds.length === 0) {
    return (
      <SectionCard title="Selected Webhooks">
        <Text color="gray">No webhooks selected</Text>
      </SectionCard>
    );
  }

  if (!webhooksData || webhooksData.items.length === 0) {
    return (
      <SectionCard title="Selected Webhooks">
        <Text color="gray">No webhooks available</Text>
      </SectionCard>
    );
  }

  const selectedWebhooks = webhooksData.items.filter((webhook) => webhookIds.includes(webhook.id));

  return (
    <SectionCard title="Webhooks">
      {selectedWebhooks.length > 0 ? (
        <Grid columns="4" gap="3">
          {selectedWebhooks.map((webhook) => (
            <Card key={webhook.id} variant="surface">
              <Flex direction="column" width="100%">
                <Text weight="bold">{webhook.name}</Text>
                <Text>{webhook.url}</Text>
              </Flex>
            </Card>
          ))}
        </Grid>
      ) : (
        <Text color="gray">Selected webhooks not found</Text>
      )}
    </SectionCard>
  );
}
