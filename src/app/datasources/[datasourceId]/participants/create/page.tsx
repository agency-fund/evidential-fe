'use client';

import { useCreateParticipantType, useInspectDatasource, useInspectTableInDatasource } from '@/api/admin';
import { FieldDescriptor, FieldMetadata } from '@/api/methods.schemas';
import { TrashIcon } from '@radix-ui/react-icons';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  IconButton,
  Radio,
  Select,
  Separator,
  Switch,
  Table,
  Text,
  TextField,
  Tooltip,
} from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { useEffect, useState } from 'react';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { isEligibleForUseAsMetric } from '@/services/genapi-helpers';
import { useParams, useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/buttons/back-button';

/** Creates a comparator function for ordering FieldDescriptors.
 *
 * TODO: When add-participant-type and edit-participant-type are consolidated, use the same ordering on both.
 */
const makeFieldDescriptorComparator = (candidatesForUniqueIdField: string[]) => {
  const candidates = new Set(candidatesForUniqueIdField);
  return (left: FieldDescriptor, right: FieldDescriptor) => {
    if (left.is_unique_id && right.is_unique_id) {
      return left.field_name.localeCompare(right.field_name);
    } else if (left.is_unique_id) {
      return -1;
    } else if (right.is_unique_id) {
      return 1;
    }

    const leftIsCandidate = candidates.has(left.field_name);
    const rightIsCandidate = candidates.has(right.field_name);
    if (leftIsCandidate && rightIsCandidate) {
      return left.field_name.localeCompare(right.field_name);
    } else if (leftIsCandidate) {
      return -1;
    } else if (rightIsCandidate) {
      return 1;
    }

    return left.field_name.localeCompare(right.field_name);
  };
};

export default function CreateParticipantTypePage() {
  const params = useParams();
  const router = useRouter();
  const datasourceId = params.datasourceId as string;

  const { data: datasourceData, isLoading: loadingDatasource } = useInspectDatasource(datasourceId!);

  const { trigger, isMutating, error, reset } = useCreateParticipantType(datasourceId, {
    swr: {
      onSuccess: async (data) => {
        router.push(`/datasources/${datasourceId}/participants/${data.participant_type}`);
      },
    },
  });

  const [selectedTable, setSelectedTable] = useState<string>('');
  const [fields, setFields] = useState<FieldDescriptor[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const tableIsSelected = selectedTable !== '';
  const { data: tableData, isLoading: loadingTableData } = useInspectTableInDatasource(
    datasourceId,
    selectedTable,
    {},
    {
      swr: {
        enabled: tableIsSelected,
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      },
    },
  );

  const updateSelectedTable = (table: string) => {
    setSelectedTable(table);
    setFields([]);
    reset();
  };

  useEffect(() => {
    if (tableData === undefined) {
      return;
    }
    const recommended_id =
      tableData.detected_unique_id_fields.length > 0 ? tableData.detected_unique_id_fields[0] : null;
    setFields(
      tableData.fields
        .map(
          (field: FieldMetadata): FieldDescriptor => ({
            is_unique_id: field.field_name === recommended_id,
            is_strata: false,
            is_filter: false,
            is_metric: false,
            ...field,
          }),
        )
        .sort(makeFieldDescriptorComparator(tableData.detected_unique_id_fields)),
    );
  }, [tableData]);

  const updateField = (index: number, field: FieldDescriptor) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleCancel = () => {
    router.push(`/datasources/${datasourceId}`);
  };

  if (!datasourceId) {
    return <Text>Error: Missing required parameters</Text>;
  }

  if (loadingDatasource) {
    return <XSpinner message="Loading datasource details..." />;
  }

  if (!datasourceData) {
    return <GenericErrorCallout title="Failed to load datasource" message="Could not load datasource details" />;
  }

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <BackButton href={`/datasources/${datasourceId}`} label="Back to Datasource" />
        <Separator my="3" size="4" />
        <Heading size="8">Add Participant Type</Heading>
        <Text size="2" color="gray">
          Define a new participant type for this datasource.
        </Text>
      </Flex>

      {isMutating ? (
        <XSpinner message="Creating participant type..." />
      ) : (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            const participant_type = fd.get('participant_type') as string;
            const table_name = fd.get('table_name') as string;
            await trigger({
              participant_type,
              schema_def: {
                table_name,
                fields: fields,
              },
            });
          }}
        >
          {error && <GenericErrorCallout title={'Failed to save participant type'} error={error} />}

          <Flex direction="column" gap="6">
            <Flex direction="column" gap="3">
              <Text as="div" size="3" weight="bold">
                Table Name
              </Text>
              <Text as="div" size={'2'} color="gray">
                Please select the name of the data warehouse table.
              </Text>
              <Box>
                <Select.Root
                  name="table_name"
                  required
                  value={selectedTable}
                  onValueChange={(value) => updateSelectedTable(value)}
                >
                  <Select.Trigger placeholder="Select a table" />
                  <Select.Content>
                    {datasourceData.tables.map((table: string) => (
                      <Select.Item key={table} value={table}>
                        {table}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            <Flex direction="column" gap="3">
              <Text as="div" size="3" weight="bold">
                Participant Type Name
              </Text>
              <TextField.Root
                name="participant_type"
                placeholder="e.g., students, faculty, organizers"
                required
                maxLength={40}
                defaultValue={selectedTable}
              />
            </Flex>

            {loadingTableData ? (
              <XSpinner message="Loading table data..." />
            ) : selectedTable === '' ? (
              <></>
            ) : (
              <Flex direction="column" gap="3">
                <Text as="div" size="3" weight="bold">
                  Fields
                </Text>
                <Flex align="center" gap="2">
                  <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                  <Text size="2">Show Advanced Options</Text>
                </Flex>
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Field Name</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Data Type</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify={'center'}>Unique ID</Table.ColumnHeaderCell>
                      {showAdvanced && <Table.ColumnHeaderCell justify={'center'}>Strata</Table.ColumnHeaderCell>}
                      <Table.ColumnHeaderCell justify={'center'}>Filter</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell justify={'center'}>Metric</Table.ColumnHeaderCell>
                      {showAdvanced && <Table.ColumnHeaderCell justify={'center'}>Actions</Table.ColumnHeaderCell>}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {fields.map((field, index) => (
                      <Table.Row key={index}>
                        <Table.Cell>
                          {tableData && tableData.detected_unique_id_fields.includes(field.field_name) ? (
                            <Text weight={'bold'}>{field.field_name}</Text>
                          ) : (
                            <Text>{field.field_name}</Text>
                          )}
                        </Table.Cell>
                        <Table.Cell>{field.data_type}</Table.Cell>
                        <Table.Cell>
                          <TextField.Root
                            value={field.description}
                            onChange={(e) =>
                              updateField(index, {
                                ...field,
                                description: e.target.value,
                              } as FieldDescriptor)
                            }
                          />
                        </Table.Cell>
                        <Table.Cell justify={'center'}>
                          <Radio
                            value={field.field_name}
                            checked={field.is_unique_id}
                            onValueChange={() => {
                              // Update all fields to set is_unique_id to false
                              const newFields = fields.map((f) => ({
                                ...f,
                                is_unique_id: false,
                              }));
                              // Then set the selected field to true
                              newFields[index].is_unique_id = true;
                              setFields(newFields);
                            }}
                            size="3"
                          />
                        </Table.Cell>
                        {showAdvanced && (
                          <Table.Cell justify={'center'}>
                            <Checkbox
                              checked={field.is_strata}
                              onCheckedChange={(checked) =>
                                updateField(index, {
                                  ...field,
                                  is_strata: checked,
                                } as FieldDescriptor)
                              }
                              size="3"
                            />
                          </Table.Cell>
                        )}
                        <Table.Cell justify={'center'}>
                          <Checkbox
                            checked={field.is_filter}
                            onCheckedChange={(checked) =>
                              updateField(index, {
                                ...field,
                                is_filter: checked,
                              } as FieldDescriptor)
                            }
                            size="3"
                          />
                        </Table.Cell>
                        <Table.Cell justify={'center'}>
                          {isEligibleForUseAsMetric(field.data_type) ? (
                            <Checkbox
                              checked={field.is_metric}
                              onCheckedChange={(checked) =>
                                updateField(index, {
                                  ...field,
                                  is_metric: checked,
                                } as FieldDescriptor)
                              }
                              size="3"
                            />
                          ) : (
                            <Tooltip content="Not eligible for use as a metric">
                              <Checkbox disabled={true} size="3" />
                            </Tooltip>
                          )}
                        </Table.Cell>
                        {showAdvanced && (
                          <Table.Cell justify={'center'}>
                            <IconButton
                              onClick={(e) => {
                                e.preventDefault();
                                removeField(index);
                              }}
                            >
                              <TrashIcon />
                            </IconButton>
                          </Table.Cell>
                        )}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Flex>
            )}
          </Flex>

          <Flex gap="3" mt="6" justify="end">
            <Button variant="soft" color="gray" type="button" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedTable || fields.length === 0}>
              Create
            </Button>
          </Flex>
        </form>
      )}
    </Flex>
  );
}
