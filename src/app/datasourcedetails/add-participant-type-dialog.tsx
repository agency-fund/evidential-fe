import { useCreateParticipantType, useInspectDatasource, useInspectTableInDatasource } from '@/api/admin';
import { FieldDescriptor, FieldMetadata } from '@/api/methods.schemas';
import { isHttpOk } from '@/services/typehelper';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { Button, Dialog, Flex, IconButton, Spinner, Switch, Table, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { useEffect, useState } from 'react';
import { GenericErrorCallout } from '@/app/components/generic-error';
import { isEligibleForUseAsMetric } from '@/services/genapi-helpers';

const AddParticipantTypeDialogInner = ({ datasourceId, tables }: { datasourceId: string; tables: string[] }) => {
  const { trigger, isMutating } = useCreateParticipantType(datasourceId);
  const [open, setOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [fields, setFields] = useState<FieldDescriptor[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string>('');

  const tableIsSelected = selectedTable !== '';
  const { data: tableData, isLoading: loadingTableData } = useInspectTableInDatasource(
    datasourceId,
    selectedTable,
    {},
    {
      swr: {
        enabled: tableIsSelected,
      },
    },
  );

  const updateSelectedTable = (table: string) => {
    setSelectedTable(table);
    setFields([]);
    setError('');
  };

  useEffect(() => {
    if (!isHttpOk(tableData)) {
      return;
    }
    const probable_unique_id_field = tableData.data.detected_unique_id_fields?.pop();
    const sortedFields = tableData.data.fields
      .map(
        (field: FieldMetadata): FieldDescriptor => ({
          is_unique_id: field.field_name == probable_unique_id_field,
          is_strata: false,
          is_filter: false,
          is_metric: false,
          ...field,
        }),
      )
      .sort((a, b) => {
        if (a.is_unique_id === b.is_unique_id) {
          return a.field_name.localeCompare(b.field_name);
        }
        return a.is_unique_id ? -1 : 1;
      });
    setFields(sortedFields);
  }, [tableData]);

  const updateField = (index: number, field: FieldDescriptor) => {
    const newFields = [...fields];
    newFields[index] = field;
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>
          <PlusIcon /> Add Participant Type
        </Button>
      </Dialog.Trigger>

      <Dialog.Content minWidth={'800px'} maxWidth={'90vw'} maxHeight={'90vh'}>
        {isMutating ? (
          <XSpinner message="Creating participant type..." />
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              const participant_type = fd.get('participant_type') as string;
              const table_name = fd.get('table_name') as string;
              setError('');
              const response = await trigger({
                participant_type,
                schema_def: {
                  table_name,
                  fields: fields,
                },
              });
              if (response.status === 200) {
                setOpen(false);
                setFields([]);
                setError('');
              } else {
                setError(JSON.stringify(response.data));
              }
            }}
          >
            <Dialog.Title>Add Participant Type</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Define a new participant type for this datasource.
            </Dialog.Description>

            {error !== '' && <GenericErrorCallout title={'Failed to save participant type'} message={error} />}

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Participant Type Name
                </Text>
                <TextField.Root
                  name="participant_type"
                  placeholder="e.g., students, faculty, organizers"
                  required
                  maxLength={40}
                />
              </label>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Table Name
                </Text>
                {!tables ? (
                  <XSpinner message="Loading table data..." />
                ) : (
                  <select
                    name="table_name"
                    required
                    value={selectedTable}
                    onChange={(e) => updateSelectedTable(e.target.value)}
                  >
                    <option value="">Select a table</option>
                    {tables.map((table: string) => (
                      <option key={table} value={table}>
                        {table}
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {loadingTableData ? (
                <XSpinner message="Loading table data..." />
              ) : selectedTable === '' ? (
                <Text>Please select a table.</Text>
              ) : (
                <>
                  <Text as="div" size="2" mb="1" weight="bold">
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
                          <Table.Cell>{field.field_name}</Table.Cell>
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
                            <input
                              type="radio"
                              name="unique_id"
                              checked={field.is_unique_id}
                              onChange={(e) => {
                                // Update all fields to set is_unique_id to false
                                const newFields = fields.map((f) => ({
                                  ...f,
                                  is_unique_id: false,
                                }));
                                // Then set the selected field to true
                                newFields[index].is_unique_id = e.target.checked;
                                setFields(newFields);
                              }}
                            />
                          </Table.Cell>
                          {showAdvanced && (
                            <Table.Cell justify={'center'}>
                              <input
                                type="checkbox"
                                checked={field.is_strata}
                                onChange={(e) =>
                                  updateField(index, {
                                    ...field,
                                    is_strata: e.target.checked,
                                  } as FieldDescriptor)
                                }
                              />
                            </Table.Cell>
                          )}
                          <Table.Cell justify={'center'}>
                            <input
                              type="checkbox"
                              checked={field.is_filter}
                              onChange={(e) =>
                                updateField(index, {
                                  ...field,
                                  is_filter: e.target.checked,
                                } as FieldDescriptor)
                              }
                            />
                          </Table.Cell>
                          <Table.Cell justify={'center'}>
                            <input
                              type="checkbox"
                              disabled={!isEligibleForUseAsMetric(field.data_type)}
                              checked={field.is_metric}
                              onChange={(e) =>
                                updateField(index, {
                                  ...field,
                                  is_metric: e.target.checked,
                                } as FieldDescriptor)
                              }
                            />
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
                </>
              )}
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit">Create</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};

export const AddParticipantTypeDialog = ({ datasourceId }: { datasourceId: string }) => {
  const { data, isLoading } = useInspectDatasource(datasourceId);
  if (isLoading) {
    return <Spinner />;
  }
  if (!isHttpOk(data)) {
    // TODO
    return <></>;
  }
  return <AddParticipantTypeDialogInner datasourceId={datasourceId} tables={data!.data.tables} />;
};
