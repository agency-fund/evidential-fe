'use client';

import { Badge, Flex, Text } from '@radix-ui/themes';
import { SectionCard } from '@/components/ui/cards/section-card';

export interface StrataSectionProps {
  strata?: string[];
}

export function StrataSection({ strata }: StrataSectionProps) {
  if (!strata || strata.length === 0) return null;

  return (
    <SectionCard title="Strata">
      <Flex gap="2" wrap="wrap">
        {strata.map((stratum, index) => (
          <Badge key={index} variant="outline" color="gray">
            <Text size="2">{stratum}</Text>
          </Badge>
        ))}
      </Flex>
    </SectionCard>
  );
}
