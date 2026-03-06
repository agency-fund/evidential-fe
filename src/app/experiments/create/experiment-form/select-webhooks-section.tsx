'use client';
import { CheckboxCards, Flex, Grid, Link, Text } from '@radix-ui/themes';
import { useListOrganizationWebhooks } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { XSpinner } from '@/components/ui/x-spinner';
import { GearIcon } from '@radix-ui/react-icons';

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

  return (
    <>
      <Text size="2" color="gray">
        Select which webhooks should receive notifications when this experiment is created.
      </Text>

      {isLoading ? (
        <XSpinner />
      ) : webhooks.length === 0 ? (
        <Text size="2" color="gray">
          There are no webhooks configured for your organization. Please visit the{' '}
          <Link href={`/organizations/${organizationId}`}>
            <GearIcon /> Settings Page
          </Link>{' '}
          to configure them.
        </Text>
      ) : (
        <CheckboxCards.Root value={selectedWebhookIds} onValueChange={onWebhookIdsChange}>
          <Grid columns="4" gap="3">
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
          </Grid>
        </CheckboxCards.Root>
      )}
    </>
  );
};
