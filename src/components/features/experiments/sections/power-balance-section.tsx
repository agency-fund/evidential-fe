'use client';

import { Button, DataList, Flex } from '@radix-ui/themes';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { AssignSummary } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';

export interface PowerBalanceSectionProps {
  confidence: number;
  power: number;
  desiredN?: number;
  assignSummary: AssignSummary | null | undefined;
  onEdit?: () => void;
  showDesiredSampleSize?: boolean;
}

export function PowerBalanceSection({
  confidence,
  power,
  desiredN,
  assignSummary,
  onEdit,
  showDesiredSampleSize = true,
}: PowerBalanceSectionProps) {
  const balanceCheck = assignSummary?.balance_check;

  return (
    <SectionCard
      title="Power & Balance"
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
        <DataList.Root style={{ flex: 1 }}>
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
          <DataList.Item>
            <DataList.Label>Actual Sample Size</DataList.Label>
            <DataList.Value>{assignSummary?.sample_size ?? 'N/A'}</DataList.Value>
          </DataList.Item>
        </DataList.Root>

        {balanceCheck ? (
          <DataList.Root style={{ flex: 1 }}>
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
        ) : null}
      </Flex>
    </SectionCard>
  );
}
