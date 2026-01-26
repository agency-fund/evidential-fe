'use client';

import { Table } from '@radix-ui/themes';
import { AssignSummary } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';

export interface StatisticsSectionProps {
  assignSummary: AssignSummary | null | undefined;
}

export function StatisticsSection({ assignSummary }: StatisticsSectionProps) {
  return (
    <SectionCard title="Statistics">
      <Table.Root>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell>Actual Sample Size</Table.RowHeaderCell>
            <Table.Cell>{assignSummary?.sample_size}</Table.Cell>
          </Table.Row>
          {assignSummary?.balance_check ? (
            <>
              <Table.Row>
                <Table.RowHeaderCell>F Statistic</Table.RowHeaderCell>
                <Table.Cell>{assignSummary.balance_check.f_statistic.toFixed(3)}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>Numerator DF</Table.RowHeaderCell>
                <Table.Cell>{assignSummary.balance_check.numerator_df}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>Denominator DF</Table.RowHeaderCell>
                <Table.Cell>{assignSummary.balance_check.denominator_df}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>P-Value</Table.RowHeaderCell>
                <Table.Cell>{assignSummary.balance_check.p_value.toFixed(3)}</Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.RowHeaderCell>Balance OK?</Table.RowHeaderCell>
                <Table.Cell>{assignSummary.balance_check.balance_ok ? 'Yes' : 'No'}</Table.Cell>
              </Table.Row>
            </>
          ) : (
            <Table.Row>
              <Table.RowHeaderCell>Balance Check</Table.RowHeaderCell>
              <Table.Cell>N/A</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </SectionCard>
  );
}
