'use client';
import {
  inspectParticipantTypesResponse,
  useGetParticipantTypes,
  useInspectParticipantTypes,
  useUpdateParticipantType,
} from '@/api/admin';
import { InspectParticipantTypesResponse, ParticipantsDef } from '@/api/methods.schemas';
import { ParticipantDefEditor } from '@/app/participanttypedetails/edit-participant-def';
import { isHttpOk } from '@/services/typehelper';
import { Button, Card, DataList, Flex, Grid, Heading, Switch, Text } from '@radix-ui/themes';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { XSpinner } from '../components/x-spinner';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
  const searchParams = useSearchParams();
  const datasourceId = searchParams.get('datasource_id');
  const participantType = searchParams.get('participant_type');
  const [editedDef, setEditedDef] = useState<ParticipantsDef | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const { data, isLoading, error } = useGetParticipantTypes(datasourceId!, participantType!);
  const {
    data: inspectData,
    isLoading: inspectDataLoading,
    error: inspectError,
  } = useInspectParticipantTypes(datasourceId!, participantType!, {
    swr: { enabled: datasourceId !== null && participantType !== null, revalidateOnFocus: false },
  });

  const { trigger: updateParticipantType } = useUpdateParticipantType(datasourceId!, participantType!);

  if (!datasourceId || !participantType) {
    return <Text>Error: Missing required parameters</Text>;
  }

  if (isLoading) {
    return <XSpinner message="Loading participant type details..." />;
  }

  if (error || !isHttpOk(data)) {
    return <Text>Error: {JSON.stringify(error)}</Text>;
  }

  const participantConfig = data.data;

  // Sort fields only in the initial config, putting unique_id field at top
  if (participantConfig.type !== 'sheet') {
    const sortedFields = [...participantConfig.fields].sort((a, b) => {
      if (a.is_unique_id === b.is_unique_id) {
        return a.field_name.localeCompare(b.field_name);
      }
      return a.is_unique_id ? -1 : 1;
    });
    participantConfig.fields = sortedFields;
  }

  if (participantConfig.type === 'sheet') {
    return (
      <Flex direction="column" gap="3">
        <Heading>Participant Type Details: {participantType}</Heading>
        <Text>Sheet Reference Configuration:</Text>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(participantConfig, null, 2)}</pre>
      </Flex>
    );
  }

  const handleSave = async () => {
    if (!editedDef) return;

    await updateParticipantType({
      fields: editedDef.fields,
    });
  };

  return (
    <Flex direction="column" gap="3">
      <Heading>Participant Type Details: {participantType}</Heading>
      <Text as="label" size="2">
        <Flex gap="2">
          <Switch size="1" checked={showEditor} onCheckedChange={setShowEditor} /> Show participant type editor
        </Flex>
      </Text>

      <InspectParticipantTypesSummary data={inspectData} />

      {showEditor && (
        <>
          <Button onClick={handleSave} disabled={!editedDef}>
            Save Changes
          </Button>
          <ParticipantDefEditor
            participantDef={editedDef || (participantConfig as ParticipantsDef)}
            onUpdate={setEditedDef}
          />
        </>
      )}
    </Flex>
  );
}

function InspectParticipantTypesSummary({ data }: { data: inspectParticipantTypesResponse | undefined }) {
  if (!data) return null;
  if (!isHttpOk(data)) return <Text>Error: {JSON.stringify(data)}</Text>;

  const inspectionData: InspectParticipantTypesResponse = data.data;
  console.log(inspectionData);
  const [showStrata, setShowStrata] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  return (
    <Flex direction="column" gap="4">
      <Flex align="center" gap="2" mb="2">
        <Button variant="ghost" onClick={() => setShowStrata(!showStrata)}>
          {showStrata ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>
        <Heading size="4">Strata Fields</Heading>
      </Flex>
      {showStrata &&
        (inspectionData.strata.length === 0 ? (
          <Text>There are no strata fields defined.</Text>
        ) : (
          <Grid columns="3" gap="4">
            {inspectionData.strata.map((field) => (
              <Card key={field.field_name}>
                <DataList.Root key={field.field_name}>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Field Name</DataList.Label>
                    <DataList.Value>{field.field_name}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Description</DataList.Label>
                    <DataList.Value>{field.description}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Data Type</DataList.Label>
                    <DataList.Value>
                      <Text color="gray">{field.data_type}</Text>
                    </DataList.Value>
                  </DataList.Item>
                </DataList.Root>
              </Card>
            ))}
          </Grid>
        ))}
      <Flex align="center" gap="2" mb="2">
        <Button variant="ghost" onClick={() => setShowMetrics(!showMetrics)}>
          {showMetrics ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>
        <Heading size="4">Metrics Fields</Heading>
      </Flex>
      {showMetrics &&
        (inspectionData.metrics.length === 0 ? (
          <Text>There are no metrics defined.</Text>
        ) : (
          <Grid columns="3" gap="4" width={'auto'}>
            {inspectionData.metrics.map((field) => (
              <Card key={field.field_name}>
                <DataList.Root>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Field Name</DataList.Label>
                    <DataList.Value>{field.field_name}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Description</DataList.Label>
                    <DataList.Value>{field.description}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Data Type</DataList.Label>
                    <DataList.Value>
                      <Text color="gray">{field.data_type}</Text>
                    </DataList.Value>
                  </DataList.Item>
                </DataList.Root>
              </Card>
            ))}
          </Grid>
        ))}

      <Flex align="center" gap="2" mb="2">
        <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Button>
        <Heading size="4">Filter Fields</Heading>
      </Flex>
      {showFilters &&
        (inspectionData.filters.length === 0 ? (
          <Text>There are no filters defined.</Text>
        ) : (
          <Grid columns="3" gap="4">
            {inspectionData.filters.map((field) => (
              <Card key={field.field_name}>
                <DataList.Root key={field.field_name}>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Field Name</DataList.Label>
                    <DataList.Value>{field.field_name}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Description</DataList.Label>
                    <DataList.Value>{field.description}</DataList.Value>
                  </DataList.Item>
                  <DataList.Item>
                    <DataList.Label minWidth="120px">Data Type</DataList.Label>
                    <DataList.Value>
                      <Text color="gray">{field.data_type}</Text>
                    </DataList.Value>
                  </DataList.Item>
                  {'min' in field && (
                    <>
                      <DataList.Item>
                        <DataList.Label>Lower Bound</DataList.Label>
                        <DataList.Value>{field.min}</DataList.Value>
                      </DataList.Item>
                      <DataList.Item>
                        <DataList.Label minWidth="120px">Upper Bound</DataList.Label>
                        <DataList.Value>{field.max}</DataList.Value>
                      </DataList.Item>
                    </>
                  )}
                  {'distinct_values' in field && field.distinct_values && (
                    <DataList.Item>
                      <DataList.Label minWidth="120px">Valid Values</DataList.Label>
                      <DataList.Value>{field.distinct_values.join(', ')}</DataList.Value>
                    </DataList.Item>
                  )}
                </DataList.Root>
              </Card>
            ))}
          </Grid>
        ))}
    </Flex>
  );
}
