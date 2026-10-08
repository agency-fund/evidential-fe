'use client';

import { Button, DataList, Flex, Table, Text } from '@radix-ui/themes';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { Filter } from '@/api/methods.schemas';
import { SectionCard } from '@/components/ui/cards/section-card';

interface DatasourceTargetingSectionProps {
  tableName?: string;
  primaryKey?: string;
  clusterKey?: string;
  targetField?: string;
  filters?: Filter[];
  onEditDatasource?: () => void;
  onEditFilters?: () => void;
}

// The operator labels and NULL wording below mirror the filter builder (querybuilder/*-filter-input.tsx),
// so a filter reads the same here as where it was defined.
const isDateString = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);

const getFilterOperatorLabel = (filter: Filter) => {
  const nonNullValues = filter.value.filter((v) => v !== null);
  if (filter.relation === 'between') {
    const min = filter.value[0] ?? null;
    const max = filter.value[1] ?? null;
    const isDate = nonNullValues.some(isDateString);
    if (min !== null && max === null) return isDate ? 'On or After' : '≥';
    if (min === null && max !== null) return isDate ? 'On or Before' : '≤';
    return 'Between';
  }
  // The field's data type isn't available here; booleans are recognized by their values.
  const isBoolean = nonNullValues.some((v) => typeof v === 'boolean');
  if (filter.relation === 'excludes') return isBoolean ? 'Is not' : 'is not one of';
  return isBoolean ? 'Is' : 'Is one of';
};

const formatBooleanOrValue = (v: string | number | boolean) =>
  typeof v === 'boolean' ? (v ? 'True' : 'False') : String(v);

const formatFilterValueDisplay = (filter: Filter) => {
  if (filter.relation === 'between') {
    const min = filter.value[0] ?? null;
    const max = filter.value[1] ?? null;
    // A third, null element means rows with NULL are included as well.
    const orNull = filter.value.length === 3 && filter.value[2] === null ? ' OR NULL' : '';
    if (min !== null && max === null) return `${String(min)}${orNull}`;
    if (min === null && max !== null) return `${String(max)}${orNull}`;
    return `${min === null ? '-' : String(min)} and ${max === null ? '-' : String(max)}${orNull}`;
  }
  const nonNullValues = filter.value.filter((v) => v !== null).map(formatBooleanOrValue);
  if (!filter.value.includes(null)) return nonNullValues.join(', ');
  if (nonNullValues.length === 0) return 'NULL';
  // Under "is not" operators, NULL is one more value being excluded.
  return `${nonNullValues.join(', ')} ${filter.relation === 'excludes' ? 'AND NOT NULL' : 'OR NULL'}`;
};

export function DatasourceTargetingSection({
  tableName,
  primaryKey,
  clusterKey,
  targetField,
  filters,
  onEditDatasource,
  onEditFilters,
}: DatasourceTargetingSectionProps) {
  return (
    <SectionCard
      title="Targeting"
      headerRight={
        onEditDatasource || onEditFilters ? (
          <Flex gap="2">
            {onEditDatasource && (
              <Button size="1" onClick={onEditDatasource}>
                <Pencil2Icon />
                Datasource
              </Button>
            )}
            {onEditFilters && (
              <Button size="1" onClick={onEditFilters}>
                <Pencil2Icon />
                Filters
              </Button>
            )}
          </Flex>
        ) : undefined
      }
    >
      <DataList.Root>
        <DataList.Item>
          <DataList.Label>Table</DataList.Label>
          <DataList.Value>{tableName || '-'}</DataList.Value>
        </DataList.Item>
        <DataList.Item>
          <DataList.Label>Unique ID</DataList.Label>
          <DataList.Value>{primaryKey || '-'}</DataList.Value>
        </DataList.Item>
        {clusterKey && (
          <DataList.Item>
            <DataList.Label>Cluster Key</DataList.Label>
            <DataList.Value>{clusterKey}</DataList.Value>
          </DataList.Item>
        )}
        {targetField && (
          <DataList.Item>
            <DataList.Label>Target column</DataList.Label>
            <DataList.Value>{targetField}</DataList.Value>
          </DataList.Item>
        )}
        {filters !== undefined && (
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
        )}
      </DataList.Root>
    </SectionCard>
  );
}
