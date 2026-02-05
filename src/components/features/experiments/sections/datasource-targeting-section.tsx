'use client';

import { DataList, Table, Text } from '@radix-ui/themes';
import { FilterOutput } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';

interface DatasourceTargetingSectionProps {
  tableName?: string;
  primaryKey?: string;
  filters: FilterOutput[];
}

const formatFilterValue = (value: Array<string | number | boolean | null>) =>
  value.map((v) => (v === null ? '(null)' : String(v))).join(', ');

const getFilterOperatorLabel = (filter: FilterOutput) => {
  if (filter.relation === 'between') {
    const min = filter.value[0] ?? null;
    const max = filter.value[1] ?? null;
    if (min !== null && max === null) return '≥';
    if (min === null && max !== null) return '≤';
    return 'between';
  }
  if (filter.relation === 'excludes') return 'excludes';
  return 'includes';
};

const formatFilterValueDisplay = (filter: FilterOutput) => {
  if (filter.relation === 'between') {
    const min = filter.value[0] ?? null;
    const max = filter.value[1] ?? null;
    if (min !== null && max === null) return String(min);
    if (min === null && max !== null) return String(max);
    return `${min === null ? '-' : String(min)} to ${max === null ? '-' : String(max)}`;
  }
  return formatFilterValue(filter.value);
};

export function DatasourceTargetingSection({ tableName, primaryKey, filters }: DatasourceTargetingSectionProps) {
  return (
    <SectionCard title="Targeting">
      <DataList.Root>
        <DataList.Item>
          <DataList.Label>Table</DataList.Label>
          <DataList.Value>{tableName || '-'}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Unique User Key</DataList.Label>
          <DataList.Value>{primaryKey || '-'}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Filters</DataList.Label>
          <DataList.Value>
            {filters.length === 0 ? (
              <Text color="gray">No filters defined</Text>
            ) : (
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Field</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Operator</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Values</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filters.map((filter, index) => {
                    return (
                      <Table.Row key={`${filter.field_name}-${index}`}>
                        <Table.Cell>{filter.field_name}</Table.Cell>
                        <Table.Cell align={'center'}>{getFilterOperatorLabel(filter)}</Table.Cell>
                        <Table.Cell>{formatFilterValueDisplay(filter)}</Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            )}
          </DataList.Value>
        </DataList.Item>
      </DataList.Root>
    </SectionCard>
  );
}
