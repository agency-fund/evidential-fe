'use client';

import { Badge, Button, DataList, Flex, Text, Tooltip } from '@radix-ui/themes';
import { Pencil2Icon, InfoCircledIcon } from '@radix-ui/react-icons';
import { AssignSummary } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';

export interface PowerBalanceSectionProps {
  confidence: number;
  power: number;
  desiredN?: number;
  assignSummary: AssignSummary | null | undefined;
  onEdit?: () => void;
  showDesiredSampleSize?: boolean;
  showActualSampleSize?: boolean;
  showTitle?: boolean;
  showBalanceCheck?: boolean;
  labelInPill?: boolean;
}

export function PowerBalanceSection({
  confidence,
  power,
  desiredN,
  assignSummary,
  onEdit,
  showDesiredSampleSize = true,
  showActualSampleSize = true,
  showTitle = true,
  showBalanceCheck = true,
  labelInPill = false,
}: PowerBalanceSectionProps) {
  const balanceCheck = assignSummary?.balance_check;

  const confidenceBadge = (
    <Badge>
      <Flex gap="2" align="center">
        {labelInPill && <Text weight="bold">Confidence</Text>}
        <Text>{confidence}%</Text>
        <Tooltip content="Chance that our test correctly shows no significant difference, if there truly is none. (The probability of avoiding a false positive.)">
          <InfoCircledIcon />
        </Tooltip>
      </Flex>
    </Badge>
  );

  const powerBadge = (
    <Badge>
      <Flex gap="2" align="center">
        {labelInPill && <Text weight="bold">Power</Text>}
        <Text>{power}%</Text>
        <Tooltip content="Chance of detecting a difference at least as large as the pre-specified minimum effect for the metric, if that difference truly exists. (The probability of avoiding a false negative.)">
          <InfoCircledIcon />
        </Tooltip>
      </Flex>
    </Badge>
  );

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
            {labelInPill ? (
              <DataList.Item>
                <DataList.Value>
                  <Flex direction="column" gap="2" align="start">
                    {confidenceBadge}
                    {powerBadge}
                  </Flex>
                </DataList.Value>
              </DataList.Item>
            ) : (
              <>
                <DataList.Item>
                  <DataList.Label>Confidence</DataList.Label>
                  <DataList.Value>{confidenceBadge}</DataList.Value>
                </DataList.Item>
                <DataList.Item>
                  <DataList.Label>Power</DataList.Label>
                  <DataList.Value>{powerBadge}</DataList.Value>
                </DataList.Item>
              </>
            )}
            {showDesiredSampleSize && (
              <DataList.Item>
                <DataList.Label>Desired Sample Size</DataList.Label>
                <DataList.Value>{desiredN ?? 'N/A'}</DataList.Value>
              </DataList.Item>
            )}
            {showActualSampleSize && (
              <DataList.Item>
                <DataList.Label>Actual Sample Size</DataList.Label>
                <DataList.Value>{assignSummary?.sample_size ?? 'N/A'}</DataList.Value>
              </DataList.Item>
            )}
          </DataList.Root>
        </Flex>

        {showBalanceCheck && balanceCheck ? (
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
