'use client';

import {
  getGetDatasourceKey,
  getListParticipantTypesKey,
  useCreateParticipantType,
  useInspectDatasource,
  useInspectTableInDatasource,
} from '@/api/admin';
import { FieldDescriptor, FieldMetadata } from '@/api/methods.schemas';
import { Box, Button, Flex, Grid, Heading, IconButton, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { useEffect, useRef, useState } from 'react';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useParams, useRouter } from 'next/navigation';
import { ParticipantFieldsEditor } from '@/components/features/participants/participant-fields-editor';
import { ChevronDownIcon, ReloadIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { useCurrentOrganization } from '@/providers/organization-provider'; 

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
  const org = useCurrentOrganization()
  const organizationId = org!.current.id

  // SWR's default behavior will sometimes validate that its cached result data matches the API responses data
  // (such as during component load, when the user switches tabs, and during subsequent renders). By default, this
  // is sending a ?refresh=false query string, which may lead to stale results due to the backend's cache. Most
  // users aren't creating new tables often so this is acceptable.
  //
  // When the user explicitly requests reload, we change the `refresh` parameter to be true. This causes the
  // backend to fetch data from the customer's DWH directly and update its cache. Thus clicking the "refresh"
  // button will cause all subsequent refreshes to skip the cache, which is desirable, because clicking the
  // refresh button once is a clear signal that the user cares about fresh data.
  const [refresh, setRefresh] = useState(false);

  const {
    data: datasourceData,
    isLoading: loadingDatasource,
    isValidating: validatingDatasource,
    mutate: mutateInspectDatasource,
  } = useInspectDatasource(datasourceId!, { refresh });

  const { trigger, isMutating, error, reset } = useCreateParticipantType(datasourceId, {
    swr: {
      onSuccess: async () => {
        await Promise.all([
          mutate(getGetDatasourceKey(datasourceId)),
          mutate(getListParticipantTypesKey(datasourceId)),
        ]);
        router.push(`/organizations/${organizationId}`);
      },
    },
  });

  const [selectedTable, setSelectedTable] = useState<string>('');
  const [fields, setFields] = useState<FieldDescriptor[]>([]);

  // New state for searchable dropdown
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tableIsSelected = selectedTable !== '';
  const { data: tableData, isLoading: loadingTableData } = useInspectTableInDatasource(
    datasourceId,
    selectedTable,
    { refresh },
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
    setSearchQuery(table);
    setFields([]);
    setIsDropdownOpen(false);
    reset();
  };

  const filteredTables =
    datasourceData?.tables.filter((table: string) => table.toLowerCase().includes(searchQuery.toLowerCase())) || [];

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // TODO: This useEffect can be replaced with event handlers.
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
  }, [tableData]);

  const uniqueIdCandidates = tableData ? tableData.detected_unique_id_fields : [];

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
            const table_name = selectedTable; // Use selectedTable instead of form data
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
              <Grid rows={'1'} columns={'2'} gap="1">
                <Box style={{ position: 'relative' }} ref={dropdownRef}>
                  <TextField.Root
                    placeholder="Search for a table..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                  >
                    <TextField.Slot side="right">
                      <ChevronDownIcon />
                    </TextField.Slot>
                  </TextField.Root>

                  {isDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 50,
                        backgroundColor: 'white',
                        border: '1px solid var(--gray-6)',
                        borderRadius: 'var(--radius-2)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '2px',
                      }}
                    >
                      {filteredTables.length > 0 ? (
                        filteredTables.map((table: string) => (
                          <div
                            key={table}
                            onClick={() => updateSelectedTable(table)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--gray-3)',
                              backgroundColor: selectedTable === table ? 'var(--gray-3)' : 'transparent',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--gray-2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                selectedTable === table ? 'var(--gray-3)' : 'transparent';
                            }}
                          >
                            <Text size="2">{table}</Text>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '0.5rem 0.75rem' }}>
                          <Text size="2" color="gray">
                            No tables found
                          </Text>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hidden input for form submission */}
                  <input type="hidden" name="table_name" value={selectedTable} required />
                </Box>
                <IconButton
                  variant={'soft'}
                  onClick={async () => {
                    if (!refresh) {
                      setRefresh(!refresh);
                    }
                    setIsDropdownOpen(true);
                    await mutateInspectDatasource();
                  }}
                  loading={validatingDatasource}
                >
                  <ReloadIcon />
                </IconButton>
              </Grid>
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
