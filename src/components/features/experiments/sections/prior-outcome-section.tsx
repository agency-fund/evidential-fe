'use client';

import { Table } from '@radix-ui/themes';
import { SectionCard } from '@/components/ui/cards/section-card';
import { LikelihoodTypes, PriorTypes } from '@/api/methods.schemas';

interface PriorOutcomeSectionProps {
  priorType?: PriorTypes;
  rewardType?: LikelihoodTypes;
}

export function PriorOutcomeSection({ priorType, rewardType }: PriorOutcomeSectionProps) {
  const outcomeLabel = rewardType === 'binary' ? 'Binary' : 'Real-valued';
  const priorLabel = priorType === 'beta' ? 'Beta' : 'Normal';

  return (
    <SectionCard title="Prior-Outcome Configuration">
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>Outcome Type</Table.RowHeaderCell>
            <Table.Cell>{outcomeLabel}</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Prior Distribution</Table.RowHeaderCell>
            <Table.Cell>{priorLabel}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </SectionCard>
  );
}
