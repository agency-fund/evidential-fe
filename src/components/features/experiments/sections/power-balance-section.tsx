'use client';

import { Button, DataList } from '@radix-ui/themes';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { AssignSummary } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';

export interface PowerBalanceSectionProps {
  confidence: number;
  power: number;
  chosenN?: number;
  assignSummary: AssignSummary | null | undefined;
  onEdit?: () => void;
}

export function PowerBalanceSection({ confidence, power, chosenN, assignSummary, onEdit }: PowerBalanceSectionProps) {
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
      <DataList.Root>
        <DataList.Item>
          <DataList.Label>Confidence</DataList.Label>
          <DataList.Value>{confidence}%</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Power</DataList.Label>
          <DataList.Value>{power}%</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Desired Sample Size</DataList.Label>
          <DataList.Value>{chosenN ?? 'N/A'}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Actual Sample Size</DataList.Label>
          <DataList.Value>{assignSummary?.sample_size ?? 'N/A'}</DataList.Value>
        </DataList.Item>
        {balanceCheck ? (
          <>
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
          </>
        ) : null}
      </DataList.Root>
    </SectionCard>
  );
}
