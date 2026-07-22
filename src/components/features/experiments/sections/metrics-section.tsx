'use client';

import { Badge, Button, DataList, Flex, Separator, Text, Tooltip } from '@radix-ui/themes';
import { InfoCircledIcon, Pencil2Icon } from '@radix-ui/react-icons';
import { DataType } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { MdeBadge } from '@/components/features/experiments/mde-badge';

export interface MetricDisplay {
  field_name: string;
  data_type: DataType;
  mde: string | number;
  estimatedMde?: string | number | null;
  hasMissingValues: boolean;
  /** Whether the sample size is sufficient to detect the target MDE. Omitted when no power analysis is available. */
  sufficientN?: boolean | null;
}

function SampleSufficiencyBadge({ sufficientN }: { sufficientN: boolean }) {
  return sufficientN ? (
    <Tooltip content="There are enough eligible participants to detect this metric's target MDE.">
      <Badge color="green">
        OK
        <InfoCircledIcon />
      </Badge>
    </Tooltip>
  ) : (
    <Tooltip content="There are not enough eligible participants to detect this metric's target MDE.">
      <Badge color="red">
        Too Few
        <InfoCircledIcon />
      </Badge>
    </Tooltip>
  );
}

function MetricBadges({ metric }: { metric: MetricDisplay }) {
  return (
    <Flex direction="column" gap="2" align="start" width="100%">
      <Flex direction="row" gap="2" align="center" justify="between" wrap="wrap" width="100%">
        <MdeBadge value={metric.mde} kind="target" size="1" hasMissingValues={metric.hasMissingValues} />
        {metric.sufficientN != null ? <SampleSufficiencyBadge sufficientN={metric.sufficientN} /> : null}
      </Flex>
      {metric.estimatedMde != null ? (
        <MdeBadge value={metric.estimatedMde} kind="estimated" size="1" hasMissingValues={metric.hasMissingValues} />
      ) : null}
    </Flex>
  );
}

export interface MetricsSectionProps {
  metrics?: {
    primary?: MetricDisplay;
    secondary?: MetricDisplay[];
  };
  strata?: string[];
  onEdit?: () => void;
  headerRight?: React.ReactNode;
}

export function MetricsSection({ metrics, strata, onEdit, headerRight }: MetricsSectionProps) {
  const editButton = onEdit ? (
    <Button size="1" onClick={onEdit}>
      <Pencil2Icon />
      Edit
    </Button>
  ) : undefined;

  return (
    <SectionCard
      title="Metrics"
      headerRight={
        headerRight || editButton ? (
          <Flex gap="3" align="center">
            {headerRight}
            {editButton}
          </Flex>
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
                <MetricBadges metric={metrics.primary} />
                {metrics?.secondary && metrics.secondary.length >= 1 && <Separator orientation="horizontal" size="4" />}
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
                    <MetricBadges metric={metric} />
                    <Separator orientation="horizontal" size="4" />
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
