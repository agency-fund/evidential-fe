'use client';

import { AssignSummary } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { Button, DataList, Flex, Text } from '@radix-ui/themes';

export interface PowerBalanceSectionProps {
  confidence: number;
  power: number;
  desiredN?: number;
  assignSummary: AssignSummary | null | undefined;
  onEdit?: () => void;
  showDesiredSampleSize?: boolean;
  showTitle?: boolean;
  /** Design effect (DEFF) from the power analysis — cluster experiments only. */
  designEffect?: number | null;
  /** Total clusters needed across all arms — cluster experiments only. */
  numClustersTotal?: number | null;
}

export function PowerBalanceSection({
  confidence,
  power,
  desiredN,
  assignSummary,
  onEdit,
  showDesiredSampleSize = true,
  showTitle = true,
  designEffect,
  numClustersTotal,
}: PowerBalanceSectionProps) {
  const balanceCheck = assignSummary?.balance_check;

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
                <DataList.Value>
                  {numClustersTotal != null ? (
                    <Flex direction="column">
                      <Text color="green" weight="bold">
                        {numClustersTotal.toLocaleString()} clusters
                      </Text>
                      <Text size="1" color="gray">
                        {(desiredN ?? 0).toLocaleString()} participants
                      </Text>
                    </Flex>
                  ) : (
                    (desiredN ?? 'N/A')
                  )}
                </DataList.Value>
              </DataList.Item>
            )}
            <DataList.Item>
              <DataList.Label>Actual Sample Size</DataList.Label>
              <DataList.Value>
                {numClustersTotal != null ? (
                  <Flex direction="column">
                    <Text color="green" weight="bold">
                      {numClustersTotal.toLocaleString()} clusters
                    </Text>
                    <Text size="1" color="gray">
                      {(assignSummary?.sample_size ?? 0).toLocaleString()} participants
                    </Text>
                  </Flex>
                ) : (
                  (assignSummary?.sample_size ?? 'N/A')
                )}
              </DataList.Value>
            </DataList.Item>
            {designEffect != null && (
              <DataList.Item>
                <DataList.Label>DEFF</DataList.Label>
                <DataList.Value>{designEffect.toFixed(2)}</DataList.Value>
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
