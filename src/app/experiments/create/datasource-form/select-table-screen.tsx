'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { DatasourceFormData, DatasourceScreenId } from './datasource-form-def';
import { useInspectDatasource, useInspectTableInDatasource } from '@/api/admin';
import { PreassignedFrequentistExperimentSpecExperimentType } from '@/api/methods.schemas';
import { XSpinner } from '@/components/ui/x-spinner';
import { Box, Flex, IconButton, Select, Text } from '@radix-ui/themes';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { SelectClusterKey } from '@/app/experiments/create/experiment-form/select-cluster-key';
import { SelectPrimaryKey } from '@/app/experiments/create/experiment-form/select-primary-key';
import { useFeatureFlag } from '@/services/feature-flags/use-feature-flag';
import { ReloadIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

type SelectTableMessages =
  | { type: 'set-table'; value: string }
  | { type: 'set-primary-key'; value: string | undefined }
  | { type: 'set-cluster-key'; value: string | undefined };

export const SelectTableScreen = ({
  data,
  dispatch,
}: ScreenProps<DatasourceFormData, SelectTableMessages, DatasourceScreenId>) => {
  const ffClusterExperimentsEnabled = useFeatureFlag('cluster_experiments');
  const [refresh, setRefresh] = useState(false);
  const [selectPrimaryKeyInput, setSelectPrimaryKeyInput] = useState(data.primaryKey ?? '');
  const [selectClusterKeyInput, setSelectClusterKeyInput] = useState(data.clusterKey ?? '');

  const {
    data: inspectData,
    isValidating: validatingDatasource,
    isLoading,
    error,
  } = useInspectDatasource(data.datasourceId!, refresh ? { refresh: true } : undefined, {
    swr: {
      enabled: !!data.datasourceId,
      onSuccess: (response) => {
        if (refresh) {
          setRefresh(false);
        }
        if (!data.tableName && response.tables.length > 0) {
          handleTableChange(response.tables[0]);
        }
      },
    },
  });

  const { data: tableData, isLoading: isLoadingTable } = useInspectTableInDatasource(
    data.datasourceId!,
    data.tableName!,
    undefined,
    {
      swr: {
        enabled: !!data.datasourceId && !!data.tableName,
        onSuccess: (response) => {
          if (!data.primaryKey) {
            const detectedPrimaryKey = response.primary_key_fields[0] ?? response.detected_unique_id_fields[0];
            if (detectedPrimaryKey) {
              handlePrimaryKeyChange(detectedPrimaryKey, detectedPrimaryKey);
            }
          }
        },
      },
    },
  );

  const tables = inspectData?.tables ?? [];
  const primaryKeyDisabled = !data.tableName || !inspectData;
  const showClusterKeyField =
    ffClusterExperimentsEnabled &&
    data.experimentType === PreassignedFrequentistExperimentSpecExperimentType.freq_preassigned;

  function handleTableChange(tableName: string) {
    setSelectPrimaryKeyInput('');
    setSelectClusterKeyInput('');
    dispatch({ type: 'set-table', value: tableName });
  }

  function handlePrimaryKeyChange(inputText: string, selectedKey?: string) {
    setSelectPrimaryKeyInput(inputText);
    dispatch({ type: 'set-primary-key', value: selectedKey });
  }

  function handleClusterKeyChange(inputText: string, selectedKey?: string) {
    setSelectClusterKeyInput(inputText);
    dispatch({ type: 'set-cluster-key', value: selectedKey });
  }

  if (isLoading) {
    return <XSpinner message="Loading tables..." />;
  }

  if (error) {
    return (
      <Flex direction="column" gap={'2'}>
        <GenericErrorCallout title="Failed to fetch tables" error={error} />
      </Flex>
    );
  }

  if (tables.length === 0) {
    return (
      <Flex direction="column" gap={'2'}>
        <Text color="gray">No tables found in this datasource. Please check your datasource configuration.</Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap={'3'}>
      <Box maxWidth={'50%'}>
        <Flex direction="column" gap={'3'}>
          <Text size="2" weight="bold">
            Select a table
          </Text>
          <Flex direction={'row'} gap={'3'}>
            <Select.Root value={data.tableName} onValueChange={handleTableChange}>
              <Select.Trigger placeholder="Select a table" />
              <Select.Content>
                {tables.map((table) => (
                  <Select.Item key={table} value={table}>
                    {table}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <IconButton
              size={'2'}
              variant={'soft'}
              onClick={async () => {
                if (!refresh) {
                  setRefresh(!refresh);
                }
              }}
              loading={validatingDatasource}
            >
              <ReloadIcon />
            </IconButton>
          </Flex>
        </Flex>
      </Box>
      <Text size="1" color="gray">
        {tables.length} table{tables.length !== 1 ? 's' : ''} available
      </Text>

      <Box maxWidth={'50%'}>
        <SelectPrimaryKey
          tableData={tableData}
          isLoading={isLoadingTable}
          inputValue={selectPrimaryKeyInput}
          onChange={handlePrimaryKeyChange}
          disabled={primaryKeyDisabled}
        />
      </Box>

      {showClusterKeyField && (
        <Box maxWidth={'50%'}>
          <SelectClusterKey
            tableData={tableData}
            isLoading={isLoadingTable}
            inputValue={selectClusterKeyInput}
            onChange={handleClusterKeyChange}
            disabled={primaryKeyDisabled}
            excludeFieldName={data.primaryKey}
          />
        </Box>
      )}
    </Flex>
  );
};
