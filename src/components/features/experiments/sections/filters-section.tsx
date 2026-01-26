'use client';

import { Table, Text } from '@radix-ui/themes';
import { DataType, FilterOutput } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

export interface FiltersSectionProps {
  filters: FilterOutput[];
  filterFieldTypes?: Record<string, DataType>;
}

export function FiltersSection({ filters, filterFieldTypes }: FiltersSectionProps) {
  return (
    <SectionCard title="Filters">
      {filters.length > 0 ? (
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Field</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Data Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Operator</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Values</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filters.map((filter, index) => {
              const dt = filterFieldTypes?.[filter.field_name];
              return (
                <Table.Row key={index}>
                  <Table.Cell>{filter.field_name}</Table.Cell>
                  <Table.Cell>{dt ? <DataTypeBadge type={dt} /> : <Text>-</Text>}</Table.Cell>
                  <Table.Cell>{filter.relation}</Table.Cell>
                  <Table.Cell>
                    {filter.value
                      .map((v: string | number | boolean | null) => (v === null ? '(null)' : String(v)))
                      .join(', ')}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      ) : (
        <Text color="gray">No filters defined</Text>
      )}
    </SectionCard>
  );
}
