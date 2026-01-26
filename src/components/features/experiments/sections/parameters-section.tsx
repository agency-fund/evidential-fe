'use client';

import { Table } from '@radix-ui/themes';
import { SectionCard } from '@/components/ui/cards/section-card';

export interface ParametersSectionProps {
  confidence: number;
  power: number;
  chosenN?: number;
}

export function ParametersSection({ confidence, power, chosenN }: ParametersSectionProps) {
  return (
    <SectionCard title="Parameters">
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>Confidence</Table.RowHeaderCell>
            <Table.Cell>{confidence}%</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Power</Table.RowHeaderCell>
            <Table.Cell>{power}%</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell>Desired sample size</Table.RowHeaderCell>
            <Table.Cell>{chosenN ?? 'N/A'}</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </SectionCard>
  );
}
