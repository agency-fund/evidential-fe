'use client';

import { DataList } from '@radix-ui/themes';
import { SectionCard } from '@/components/ui/cards/section-card';
import { LikelihoodTypes, PriorTypes } from '@/api/methods.schemas';

interface OutcomesPriorSectionProps {
  priorType?: PriorTypes;
  rewardType?: LikelihoodTypes;
}

export function OutcomesPriorSection({ priorType, rewardType }: OutcomesPriorSectionProps) {
  const outcomeLabel = rewardType === 'binary' ? 'Binary' : 'Real-valued';
  const priorLabel = priorType === 'beta' ? 'Beta' : 'Normal';

  return (
    <SectionCard title="Outcomes & Prior">
      <DataList.Root>
        <DataList.Item>
          <DataList.Label>Outcome Type</DataList.Label>
          <DataList.Value>{outcomeLabel}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Prior Distribution</DataList.Label>
          <DataList.Value>{priorLabel}</DataList.Value>
        </DataList.Item>
      </DataList.Root>
    </SectionCard>
  );
}
