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
              <Flex direction="row" gap="2" justify={'between'} width={'100%'}>
                <Text>{metrics.primary.field_name}</Text>
                <Flex direction={'row'} gap={'3'}>
                  <DataTypeBadge type={metrics.primary.data_type} />
                  <MdeBadge value={metrics.primary.mde} size="1" />
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
                  <Flex key={metric.field_name} gap="2" justify={'between'} width={'100%'}>
                    <Text>{metric.field_name}</Text>
                    <Flex direction={'row'} gap={'3'}>
                      <DataTypeBadge type={metric.data_type} />
                      <MdeBadge value={metric.mde} size="1" />
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
