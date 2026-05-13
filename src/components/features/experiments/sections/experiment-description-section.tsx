'use client';

import { useListOrganizationWebhooks } from '@/api/admin';
import { CreateExperimentResponse } from '@/api/methods.schemas';
import { ExperimentTypeOptions } from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import { isClusterDesign } from '@/components/features/experiments/cluster-detection';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { XSpinner } from '@/components/ui/x-spinner';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { formatIsoDateLocal } from '@/services/date-utils';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { Button, DataList, Flex, Text } from '@radix-ui/themes';
import NextLink from 'next/link';

interface ExperimentDescriptionSectionProps {
  response: CreateExperimentResponse;
  onEdit?: () => void;
}

export function ExperimentDescriptionSection({ response, onEdit }: ExperimentDescriptionSectionProps) {
  const designSpec = response.design_spec;
  const webhookIds = response.webhooks ?? [];
  const org = useCurrentOrganization();
  const organizationId = org?.current.id ?? '';
  const { data: webhooksData, isLoading: loadingWebhooks } = useListOrganizationWebhooks(organizationId, {
    swr: { enabled: !!organizationId },
  });
  const selectedWebhooks = webhooksData?.items?.filter((webhook) => webhookIds.includes(webhook.id)) ?? [];
  // Cluster experiments are stored as freq_preassigned on the BE (the FE-only
  // "freq_cluster_preassigned" type is translated at submit time). Show the
  // cluster-flavoured title when this is a cluster experiment so the user
  // sees what they actually picked on the Type screen.
  const isCluster = isClusterDesign(designSpec, (response as { power_analyses?: unknown }).power_analyses);
  const experimentTypeTitle = isCluster
    ? 'Cluster Preassigned A/B Testing'
    : (ExperimentTypeOptions.find((v) => v.value == designSpec.experiment_type)?.title ?? designSpec.experiment_type);
  return (
    <SectionCard
      title="Experiment Description"
      headerRight={
        onEdit ? (
          <Button size="1" onClick={onEdit}>
            <Pencil2Icon />
            Edit
          </Button>
        ) : undefined
      }
    >
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
              <NextLink href={designSpec.design_url} target="_blank" rel="noopener noreferrer">
                {designSpec.design_url}
              </NextLink>
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
        {webhookIds.length ? (
          <DataList.Item>
            <DataList.Label>Webhooks</DataList.Label>
            <DataList.Value>
              <Flex direction="column" gap="1">
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
          </DataList.Item>
        ) : null}
      </DataList.Root>
    </SectionCard>
  );
}
