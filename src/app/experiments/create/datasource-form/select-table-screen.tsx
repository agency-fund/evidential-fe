'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { DatasourceFormData } from './datasource-form-def';
import { useInspectDatasource, useInspectTableInDatasource } from '@/api/admin';
import { XSpinner } from '@/components/ui/x-spinner';
import { Flex, Select, Table, Text } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

type SelectTableMessages = { type: 'set-table'; value: string };

export const SelectTableScreen = ({ data, dispatch }: ScreenProps<DatasourceFormData, SelectTableMessages>) => {
  const {
    data: inspectData,
    isLoading,
    error,
  } = useInspectDatasource(data.datasourceId!, undefined, {
    swr: {
      enabled: !!data.datasourceId,
    },
  });

  const tables = inspectData?.tables ?? [];

  const { data: tableData, isLoading: isLoadingTable } = useInspectTableInDatasource(
    data.datasourceId!,
    data.tableName!,
    undefined,
    {
      swr: {
        enabled: !!data.datasourceId && !!data.tableName,
      },
    },
  );

  if (isLoading) {
    return <XSpinner message="Loading tables..." />;
  }

  if (error) {
    return (
      <Flex direction="column" gap={'2'}>
        <WizardBreadcrumbs />
        <GenericErrorCallout title="Failed to fetch tables" error={error} />
      </Flex>
    );
  }

  if (tables.length === 0) {
    return (
      <Flex direction="column" gap={'2'}>
        <WizardBreadcrumbs />
        <Text color="gray">No tables found in this datasource. Please check your datasource configuration.</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap={'3'}>
      <WizardBreadcrumbs />
      <Text size="2" weight="bold">
        Select a table
      </Text>
      <Select.Root
        value={data.tableName}
        onValueChange={(tableName) => {
          dispatch({ type: 'set-table', value: tableName });
        }}
      >
        <Select.Trigger placeholder="Select a table" />
        <Select.Content>
          {tables.map((table) => (
            <Select.Item key={table} value={table}>
              {table}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <Text size="1" color="gray">
        {tables.length} table{tables.length !== 1 ? 's' : ''} available
      </Text>

      {data.tableName && (
        <Flex direction="column" gap="2" mt="3">
          <Text size="2" weight="bold">
            Table Schema
          </Text>
          {isLoadingTable ? (
            <XSpinner message="Loading table schema..." />
          ) : tableData?.fields && tableData.fields.length > 0 ? (
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Field Name</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Data Type</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {tableData.fields.map((field) => (
                  <Table.Row key={field.field_name}>
                    <Table.Cell>
                      <Text size="2" weight="medium">
                        {field.field_name}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <DataTypeBadge type={field.data_type} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <Text size="2" color="gray">
              No fields found in this table.
            </Text>
          )}
        </Flex>
      )}
    </Flex>
  );
};
