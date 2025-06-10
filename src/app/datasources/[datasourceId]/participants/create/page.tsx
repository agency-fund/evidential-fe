'use client';

import {
  getGetDatasourceKey,
  getListParticipantTypesKey,
  useCreateParticipantType,
  useInspectDatasource,
  useInspectTableInDatasource,
} from '@/api/admin';
import { FieldDescriptor, FieldMetadata } from '@/api/methods.schemas';
import { Box, Button, Flex, Heading, Select, Separator, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { useEffect, useState } from 'react';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useParams, useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/buttons/back-button';
import { ParticipantFieldsEditor } from '@/components/features/participants/participant-fields-editor';
import { mutate } from 'swr';

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
        await Promise.all([
          mutate(getGetDatasourceKey(datasourceId)),
          mutate(getListParticipantTypesKey(datasourceId)),
        ]);
        router.push(`/datasources/${datasourceId}/participants/${data.participant_type}`);
      },
    },
  });

  const [selectedTable, setSelectedTable] = useState<string>('');
  const [fields, setFields] = useState<FieldDescriptor[]>([]);
  const [uniqueIdCandidates, setUniqueIdCandidates] = useState<string[]>([]);

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
    setUniqueIdCandidates([]);
    reset();
  };

  useEffect(() => {
    if (tableData === undefined) {
      return;
    }
    const recommended_id =
      tableData.detected_unique_id_fields.length > 0 ? tableData.detected_unique_id_fields[0] : null;

    const initialFields = tableData.fields.map(
      (field: FieldMetadata): FieldDescriptor => ({
        is_unique_id: field.field_name === recommended_id,
        is_strata: false,
        is_filter: false,
        is_metric: false,
        ...field,
      }),
    );

    const sortedFields = [...initialFields].sort(makeFieldDescriptorComparator(tableData.detected_unique_id_fields));
    setFields(sortedFields);
    setUniqueIdCandidates(tableData.detected_unique_id_fields);
  }, [tableData]);

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
                <ParticipantFieldsEditor
                  fields={fields}
                  onFieldsChange={setFields}
                  uniqueIdCandidates={uniqueIdCandidates}
                  allowFieldRemoval={true}
                />
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
