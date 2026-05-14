'use client';

import { DataType } from '@/api/methods.schemas';
import { MdeBadge } from '@/components/features/experiments/mde-badge';
import { SectionCard } from '@/components/ui/cards/section-card';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { Button, DataList, Flex, Text } from '@radix-ui/themes';

export interface MetricDisplay {
  field_name: string;
  data_type: DataType;
  mde: string | number;
  /**
   * Optional achievable MDE for the experiment's committed sample size, as a
   * percent number (e.g. 7.8 for 7.8%). Render alongside the target MDE so
   * reviewers can see what effect the saved N is actually powered to detect.
   * Caller is responsible for omitting it when achievable == target (e.g. the
   * user picked the recommended sample size).
   */
  achievable?: string | number | null;
}

export interface MetricsSectionProps {
  metrics?: {
    primary?: MetricDisplay;
    secondary?: MetricDisplay[];
  };
  strata?: string[];
  onEdit?: () => void;
  /** Cluster randomization fields shown for the cluster-preassigned type (issue #217). */
  cluster?: {
    field_name: string;
    icc: string | number;
    cv: string | number;
    avg_cluster_size: string | number;
  };
}

const formatNum = (val: string | number) => {
  const n = typeof val === 'number' ? val : Number(val);
  if (Number.isNaN(n)) return String(val);
  return String(n);
};

export function MetricsSection({ metrics, strata, onEdit, cluster }: MetricsSectionProps) {
  const cvNum = cluster ? (typeof cluster.cv === 'number' ? cluster.cv : Number(cluster.cv)) : NaN;
  const highVariability = !Number.isNaN(cvNum) && cvNum > 0.5;
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
                  <MdeBadge value={metrics.primary.mde} achievable={metrics.primary.achievable} size="1" />
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
                      <MdeBadge value={metric.mde} achievable={metric.achievable} size="1" />
                    </Flex>
                  </Flex>
                ))}
              </Flex>
            ) : (
              <Text>None</Text>
            )}
          </DataList.Value>
        </DataList.Item>
        {cluster ? (
          <>
            <DataList.Item>
              <DataList.Label>Cluster ID field</DataList.Label>
              <DataList.Value>
                <Text>{cluster.field_name}</Text>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label>ICC</DataList.Label>
              <DataList.Value>
                <Text>{formatNum(cluster.icc)}</Text>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label>CV</DataList.Label>
              <DataList.Value>
                <Flex gap="2" align="center">
                  <Text>{formatNum(cluster.cv)}</Text>
                  {highVariability && (
                    <Text size="1" color="amber">
                      ⚠ high variability
                    </Text>
                  )}
                </Flex>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label>Avg cluster size</DataList.Label>
              <DataList.Value>
                <Text>{formatNum(cluster.avg_cluster_size)}</Text>
              </DataList.Value>
            </DataList.Item>
          </>
        ) : (
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
        )}
      </DataList.Root>
    </SectionCard>
  );
}
