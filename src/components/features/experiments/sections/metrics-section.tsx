'use client';

import { Button, DataList, Flex, Text } from '@radix-ui/themes';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { DataType } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { MdeBadge } from '@/components/features/experiments/mde-badge';

export interface MetricDisplay {
  field_name: string;
  data_type: DataType;
  mde: string | number;
  estimatedMde?: string | number | null;
}

export interface MetricsSectionProps {
  metrics?: {
    primary?: MetricDisplay;
    secondary?: MetricDisplay[];
  };
  strata?: string[];
  onEdit?: () => void;
}

export function MetricsSection({ metrics, strata, onEdit }: MetricsSectionProps) {
  return (
    <SectionCard
      title="Metrics"
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
          <DataList.Label>Primary Metric</DataList.Label>
          <DataList.Value>
            {metrics?.primary ? (
              <Flex direction="column" gap="2" width={'100%'}>
                <Flex direction="row" gap="2" align="center">
                  <Text>{metrics.primary.field_name}</Text>
                  <DataTypeBadge type={metrics.primary.data_type} />
                </Flex>
                <Flex direction="column" gap="2" align="start">
                  <MdeBadge value={metrics.primary.mde} kind="target" size="1" />
                  {metrics.primary.estimatedMde != null && (
                    <MdeBadge value={metrics.primary.estimatedMde} kind="estimated" size="1" />
                  )}
                </Flex>
              </Flex>
            ) : (
              <Text>-</Text>
            )}
          </DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Secondary Metrics</DataList.Label>
          <DataList.Value>
            {(metrics?.secondary ?? []).length > 0 ? (
              <Flex direction="column" gap="2" width={'100%'}>
                {(metrics?.secondary ?? []).map((metric) => (
                  <Flex key={metric.field_name} direction="column" gap="2" width={'100%'}>
                    <Flex direction="row" gap="2" align="center">
                      <Text>{metric.field_name}</Text>
                      <DataTypeBadge type={metric.data_type} />
                    </Flex>
                    <Flex direction="column" gap="2" align="start">
                      <MdeBadge value={metric.mde} kind="target" size="1" />
                      {metric.estimatedMde != null && (
                        <MdeBadge value={metric.estimatedMde} kind="estimated" size="1" />
                      )}
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Text>None</Text>
            )}
          </DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Strata</DataList.Label>
          <DataList.Value>
            {strata && strata.length > 0 ? (
              <Flex gap="2" wrap="wrap">
                {strata.map((stratum) => (
                  <Text key={stratum} size="2" color="gray">
                    {stratum}
                  </Text>
                ))}
              </Flex>
            ) : (
              <Text>None</Text>
            )}
          </DataList.Value>
        </DataList.Item>
      </DataList.Root>
    </SectionCard>
  );
}
