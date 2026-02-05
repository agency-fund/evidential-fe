'use client';

import { DataList, Flex, Text } from '@radix-ui/themes';
import Link from 'next/link';
import { CreateExperimentResponse } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { formatIsoDateLocal } from '@/services/date-utils';
import { useListOrganizationWebhooks } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { ExperimentTypeOptions } from '@/app/experiments/create/experiment-form/experiment-form-helpers';

export function ExperimentDescriptionSection({ response }: { response: CreateExperimentResponse }) {
  const designSpec = response.design_spec;
  const webhookIds = response.webhooks ?? [];
  const org = useCurrentOrganization();
  const organizationId = org?.current.id ?? '';
  const { data: webhooksData, isLoading: loadingWebhooks } = useListOrganizationWebhooks(organizationId, {
    swr: { enabled: !!organizationId },
  });
  const selectedWebhooks = webhooksData?.items?.filter((webhook) => webhookIds.includes(webhook.id)) ?? [];
  const experimentTypeTitle =
    ExperimentTypeOptions.find((v) => v.value == designSpec.experiment_type)?.title ?? designSpec.experiment_type;
  return (
    <SectionCard title="Experiment Description">
      <DataList.Root>
        <DataList.Item>
          <DataList.Label>Experiment Type</DataList.Label>
          <DataList.Value>{experimentTypeTitle}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Name</DataList.Label>
          <DataList.Value>{designSpec.experiment_name}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Hypothesis</DataList.Label>
          <DataList.Value>
            <ReadMoreText text={designSpec.description || '-'} />
          </DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Design Document</DataList.Label>
          <DataList.Value>
            {designSpec.design_url ? (
              <Link href={designSpec.design_url} target="_blank" rel="noopener noreferrer">
                {designSpec.design_url}
              </Link>
            ) : (
              '-'
            )}
          </DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Start Date</DataList.Label>
          <DataList.Value>{designSpec.start_date ? formatIsoDateLocal(designSpec.start_date) : '-'}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>End Date</DataList.Label>
          <DataList.Value>{designSpec.end_date ? formatIsoDateLocal(designSpec.end_date) : '-'}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Webhooks</DataList.Label>
          <DataList.Value>
            {webhookIds.length === 0 ? (
              <Text color="gray">None</Text>
            ) : loadingWebhooks ? (
              <Text color="gray">Loading webhooks...</Text>
            ) : selectedWebhooks.length > 0 ? (
              <Flex direction="column" gap="1">
                {selectedWebhooks.map((webhook) => (
                  <Flex key={webhook.id} direction="column" gap="1">
                    <Text weight="bold">{webhook.name}</Text>
                    <Text size="2" color="gray">
                      {webhook.url}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Text color="gray">Selected webhooks not found</Text>
            )}
          </DataList.Value>
        </DataList.Item>
      </DataList.Root>
    </SectionCard>
  );
}
