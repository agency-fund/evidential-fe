'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { CheckboxCards, Flex, Grid, Heading, Link, Text } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { useListOrganizationWebhooks } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { XSpinner } from '@/components/ui/x-spinner';
import { GearIcon } from '@radix-ui/react-icons';

type ExperimentDescribeWebhooksScreenMessage = { type: 'set-webhook-ids'; value: string[] };

export const ExperimentDescribeWebhooksScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentDescribeWebhooksScreenMessage>) => {
  const org = useCurrentOrganization();
  const organizationId = org?.current.id;

  const { data: webhooksData, isLoading } = useListOrganizationWebhooks(organizationId || '', {
    swr: { enabled: !!organizationId },
  });

  const webhooks = webhooksData?.items ?? [];

  return (
    <Flex direction="column" gap="3">
      <WizardBreadcrumbs />
      <Heading size="4">Webhooks</Heading>
      <Text size="2" color="gray">
        Select which webhooks should receive notifications when this experiment is created.
      </Text>

      {isLoading ? (
        <XSpinner />
      ) : webhooks.length === 0 ? (
        <Text size="2" color="gray">
          There are no webhooks configured for your organization. Please visit the{' '}
          <Link href={`/organizations/${organizationId}`}>
            <GearIcon style={{ display: 'inline', verticalAlign: 'middle' }} /> Settings Page
          </Link>{' '}
          to configure them.
        </Text>
      ) : (
        <CheckboxCards.Root
          value={data.selectedWebhookIds ?? []}
          onValueChange={(value) => dispatch({ type: 'set-webhook-ids', value })}
        >
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
    </Flex>
  );
};
