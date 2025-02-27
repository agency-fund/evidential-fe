'use client';
import {
  getGetParticipantTypesKey,
  getInspectParticipantTypesKey,
  useGetParticipantTypes,
  useInspectParticipantTypes,
  useUpdateParticipantType,
} from '@/api/admin';
import { ParticipantsDef } from '@/api/methods.schemas';
import { ParticipantDefEditor } from '@/app/participanttypedetails/edit-participant-def';
import { isHttpOk } from '@/services/typehelper';
import { Button, Flex, Heading, Switch, Text } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { InspectParticipantTypesSummary } from '@/app/participanttypedetails/inspect-participant-types-summary';
import { mutate } from 'swr';

export default function Page() {
  const searchParams = useSearchParams();
  const datasourceId = searchParams.get('datasource_id');
  const participantType = searchParams.get('participant_type');
  const [editedDef, setEditedDef] = useState<ParticipantsDef | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const { data, isLoading, error } = useGetParticipantTypes(datasourceId!, participantType!, {
    swr: {
      enabled: datasourceId !== null && participantType !== null,
    },
  });
  const {
    data: inspectData,
    isLoading: inspectLoading,
    isValidating: inspectValidating,
  } = useInspectParticipantTypes(
    datasourceId!,
    participantType!,
    {},
    {
      swr: {
        enabled: datasourceId !== null && participantType !== null,
      },
    },
  );
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

    updateParticipantType({
      fields: editedDef.fields,
    })
      .then(() => mutate(getGetParticipantTypesKey(datasourceId!, participantType!)))
      .then(() => mutate(getInspectParticipantTypesKey(datasourceId!, participantType!, {})));
  };

  return (
    <Flex direction="column" gap="3">
      <Heading>Participant Type Details: {participantType}</Heading>
      <Text as="label" size="2">
        <Flex gap="2">
          <Switch size="1" checked={showEditor} onCheckedChange={setShowEditor} /> Show participant type editor
        </Flex>
      </Text>

      {inspectLoading || inspectValidating ? (
        <XSpinner message={`Inspecting participant type ${participantType}...`} />
      ) : (
        <InspectParticipantTypesSummary data={inspectData} />
      )}

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
