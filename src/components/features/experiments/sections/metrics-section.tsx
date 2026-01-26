'use client';

import { Flex, Text } from '@radix-ui/themes';
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
}

export function MetricsSection({ metrics }: MetricsSectionProps) {
  return (
    <SectionCard title="Metrics">
      <Flex direction="column" gap="3">
        <Flex direction="column" gap="1">
          <Text weight="bold">Primary Metric</Text>
          {metrics?.primary ? (
            <Flex direction="row" gap="2" wrap="wrap" align="center" justify="between">
              <Text>{metrics.primary.field_name}</Text>
              <Flex direction="row" wrap="wrap" gap="2" align="center" justify="between">
                <DataTypeBadge type={metrics.primary.data_type} />
                <MdeBadge value={metrics.primary.mde} size="1" />
              </Flex>
            </Flex>
          ) : (
            <Text>-</Text>
          )}
        </Flex>
        <Flex direction="column" gap="1">
          <Text weight="bold">Secondary Metrics</Text>
          {(metrics?.secondary ?? []).length > 0 ? (
            (metrics?.secondary ?? []).map((metric) => (
              <Flex key={metric.field_name} gap="2" wrap="wrap" align="center" justify="between">
                <Text>{metric.field_name}</Text>
                <Flex direction="row" wrap="wrap" gap="2" align="center" justify="between">
                  <DataTypeBadge type={metric.data_type} />
                  <MdeBadge value={metric.mde} size="1" />
                </Flex>
              </Flex>
            ))
          ) : (
            <Text>None</Text>
          )}
        </Flex>
      </Flex>
    </SectionCard>
  );
}
