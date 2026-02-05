'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { DatasourceFormData } from './datasource-form-def';
import { useInspectDatasource, useInspectTableInDatasource } from '@/api/admin';
import { XSpinner } from '@/components/ui/x-spinner';
import { Box, Flex, Select, Text } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { SelectPrimaryKey } from '@/app/experiments/create/experiment-form/select-primary-key';

type SelectTableMessages = { type: 'set-table'; value: string } | { type: 'set-primary-key'; value: string };

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

  const primaryKeyDisabled = !data.tableName || !inspectData;

  return (
    <Flex direction="column" gap={'3'}>
      <WizardBreadcrumbs />
      <Box maxWidth={'50%'}>
        <Flex direction="column" gap={'3'}>
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
        </Flex>
      </Box>
      <Text size="1" color="gray">
        {tables.length} table{tables.length !== 1 ? 's' : ''} available
      </Text>

      <Box maxWidth={'50%'}>
        <SelectPrimaryKey
          tableData={tableData}
          isLoading={isLoadingTable}
          value={data.primaryKey}
          onChange={(value) => dispatch({ type: 'set-primary-key', value })}
          disabled={primaryKeyDisabled}
        />
      </Box>
    </Flex>
  );
};
