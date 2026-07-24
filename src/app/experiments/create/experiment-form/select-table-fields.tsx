'use client';
import { useInspectDatasource, useInspectTableInDatasource } from '@/api/admin';
import { DataType } from '@/api/methods.schemas';
import { Box, Flex, IconButton, Select, Text } from '@radix-ui/themes';
import { ReloadIcon } from '@radix-ui/react-icons';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { SelectPrimaryKey } from './select-primary-key';
import { SelectClusterKey } from './select-cluster-key';
import { SelectTargetField } from './select-target-field';
import { useState } from 'react';

interface SelectTableFieldsProps {
  datasourceId: string;
  tableName: string | undefined;
  primaryKey: string | undefined;
  // Seed values for the comboboxes (so a revisited step shows the prior selection).
  clusterKey?: string;
  targetFieldName?: string;
  onTableChange: (tableName: string) => void;
  onPrimaryKeyChange: (fieldName: string | undefined) => void;
  // Cluster-key field (freq clustered experiments).
  showClusterKey?: boolean;
  onClusterKeyChange?: (fieldName: string | undefined) => void;
  // Target-column field (DWH-backed MAB).
  showTargetField?: boolean;
  onTargetFieldChange?: (fieldName: string | undefined, dataType: DataType | undefined) => void;
}

/**
 * Table selection plus its dependent field pickers (primary key, and optionally a cluster key or a
 * target column), sharing the datasource/table inspection and auto-select logic. Owns the combobox
 * input text; reset it across datasources by giving this a `key={datasourceId}` at the call site.
 */
export const SelectTableFields = ({
  datasourceId,
  tableName,
  primaryKey,
  clusterKey,
  targetFieldName,
  onTableChange,
  onPrimaryKeyChange,
  showClusterKey,
  onClusterKeyChange,
  showTargetField,
  onTargetFieldChange,
}: SelectTableFieldsProps) => {
  const [refresh, setRefresh] = useState(false);
  const [primaryKeyInput, setPrimaryKeyInput] = useState(primaryKey ?? '');
  const [clusterKeyInput, setClusterKeyInput] = useState(clusterKey ?? '');
  const [targetFieldInput, setTargetFieldInput] = useState(targetFieldName ?? '');

  const {
    data: inspectData,
    isValidating,
    isLoading: loadingTables,
    error,
  } = useInspectDatasource(datasourceId, refresh ? { refresh: true } : undefined, {
    swr: {
      enabled: !!datasourceId,
      onSuccess: (response) => {
        if (refresh) {
          setRefresh(false);
        }
        if (!tableName && response.tables.length > 0) {
          handleTableChange(response.tables[0]);
        }
      },
    },
  });

  const { data: tableData, isLoading: loadingTable } = useInspectTableInDatasource(
    datasourceId,
    tableName!,
    undefined,
    {
      swr: {
        enabled: !!datasourceId && !!tableName,
        onSuccess: (response) => {
          if (!primaryKey) {
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
  const disabled = !tableName || !inspectData;

  function handleTableChange(newTableName: string) {
    setPrimaryKeyInput('');
    setClusterKeyInput('');
    setTargetFieldInput('');
    onTableChange(newTableName);
  }

  function handlePrimaryKeyChange(inputText: string, selectedKey?: string) {
    setPrimaryKeyInput(inputText);
    onPrimaryKeyChange(selectedKey);
  }

  function handleClusterKeyChange(inputText: string, selectedKey?: string) {
    setClusterKeyInput(inputText);
    onClusterKeyChange?.(selectedKey);
  }

  function handleTargetFieldChange(inputText: string, selectedKey?: string) {
    setTargetFieldInput(inputText);
    const dataType = selectedKey ? tableData?.fields.find((f) => f.field_name === selectedKey)?.data_type : undefined;
    onTargetFieldChange?.(selectedKey, dataType);
  }

  if (loadingTables) {
    return <XSpinner message="Loading tables..." />;
  }

  if (error) {
    return <GenericErrorCallout title="Failed to fetch tables" error={error} />;
  }

  if (tables.length === 0) {
    return <Text color="gray">No tables found in this datasource. Please check your datasource configuration.</Text>;
  }

  return (
    <Flex direction="column" gap="3">
      <Box maxWidth="50%">
        <Flex direction="column" gap="2">
          <Text size="2" weight="bold">
            Select a table
          </Text>
          <Flex direction="row" gap="3">
            <Select.Root value={tableName} onValueChange={handleTableChange}>
              <Select.Trigger placeholder="Select a table" />
              <Select.Content>
                {tables.map((table) => (
                  <Select.Item key={table} value={table}>
                    {table}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <IconButton size="2" variant="soft" onClick={() => setRefresh(true)} loading={isValidating}>
              <ReloadIcon />
            </IconButton>
          </Flex>
        </Flex>
      </Box>

      <Box maxWidth="50%">
        <SelectPrimaryKey
          tableData={tableData}
          isLoading={loadingTable}
          inputValue={primaryKeyInput}
          onChange={handlePrimaryKeyChange}
          disabled={disabled}
        />
      </Box>

      {showClusterKey && (
        <Box maxWidth="50%">
          <SelectClusterKey
            tableData={tableData}
            isLoading={loadingTable}
            inputValue={clusterKeyInput}
            onChange={handleClusterKeyChange}
            disabled={disabled}
            excludeFieldName={primaryKey}
          />
        </Box>
      )}

      {showTargetField && (
        <Box maxWidth="50%">
          <SelectTargetField
            tableData={tableData}
            isLoading={loadingTable}
            inputValue={targetFieldInput}
            onChange={handleTargetFieldChange}
            disabled={disabled}
            excludeFieldName={primaryKey}
          />
        </Box>
      )}
    </Flex>
  );
};
