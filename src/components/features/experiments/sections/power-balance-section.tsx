'use client';

import { Button, DataList, Flex } from '@radix-ui/themes';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { AssignSummary, MetricPowerAnalysisOutput } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';

export interface PowerBalanceSectionProps {
  confidence: number;
  power: number;
  desiredN?: number;
  assignSummary: AssignSummary | null | undefined;
  primaryPowerAnalysis?: MetricPowerAnalysisOutput;
  onEdit?: () => void;
  showDesiredSampleSize?: boolean;
  showTitle?: boolean;
}

export function PowerBalanceSection({
  confidence,
  power,
  desiredN,
  assignSummary,
  primaryPowerAnalysis,
  onEdit,
  showDesiredSampleSize = true,
  showTitle = true,
}: PowerBalanceSectionProps) {
  const balanceCheck = assignSummary?.balance_check;
  const numClustersTotal = primaryPowerAnalysis?.num_clusters_total;
  // Actual sample size should only differ from the desired if the datasource lost eligible
  // participants between the time of power calculation and the time of assignment, which hopefully
  // is a very rare event.
  const actualSampleSize = assignSummary?.sample_size;
  const showActualSampleSize = actualSampleSize !== undefined && actualSampleSize !== desiredN;

  return (
    <SectionCard
      title={showTitle ? 'Power & Balance' : undefined}
      headerRight={
        onEdit ? (
          <Button size="1" onClick={onEdit}>
            <Pencil2Icon />
            Edit
          </Button>
        ) : undefined
      }
    >
      <Flex gap="4" direction="row" align="start">
        <Flex flexGrow="1">
          <DataList.Root>
            <DataList.Item>
              <DataList.Label>
                <b>Power Parameters</b>
              </DataList.Label>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label>Confidence</DataList.Label>
              <DataList.Value>{confidence}%</DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label>Power</DataList.Label>
              <DataList.Value>{power}%</DataList.Value>
            </DataList.Item>
            {showDesiredSampleSize && (
              <DataList.Item>
                <DataList.Label>Desired Sample Size</DataList.Label>
                <DataList.Value>{desiredN ?? 'N/A'}</DataList.Value>
              </DataList.Item>
            )}
            {numClustersTotal != null && (
              <DataList.Item>
                <DataList.Label>Clusters</DataList.Label>
                <DataList.Value>{numClustersTotal.toLocaleString()}</DataList.Value>
              </DataList.Item>
            )}
            {showActualSampleSize && (
              <DataList.Item>
                <DataList.Label>Actual Sample Size</DataList.Label>
                <DataList.Value>{actualSampleSize} participants</DataList.Value>
              </DataList.Item>
            )}
          </DataList.Root>
        </Flex>

        {balanceCheck ? (
          <Flex flexGrow="1">
            <DataList.Root>
              <DataList.Item>
                <DataList.Label>
                  <b>Balance Check</b>
                </DataList.Label>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>F Statistic</DataList.Label>
                <DataList.Value>{balanceCheck.f_statistic.toFixed(3)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Numerator DF</DataList.Label>
                <DataList.Value>{balanceCheck.numerator_df}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Denominator DF</DataList.Label>
                <DataList.Value>{balanceCheck.denominator_df}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>P-Value</DataList.Label>
                <DataList.Value>{balanceCheck.p_value.toFixed(3)}</DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label>Balance OK?</DataList.Label>
                <DataList.Value>{balanceCheck.balance_ok ? 'Yes' : 'No'}</DataList.Value>
              </DataList.Item>
            </DataList.Root>
          </Flex>
        ) : null}
      </Flex>
    </SectionCard>
  );
}
