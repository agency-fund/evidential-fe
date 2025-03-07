'use client';
import { useGetParticipantTypes, useInspectParticipantTypes } from '@/api/admin';
import { isHttpOk } from '@/services/typehelper';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { useSearchParams } from 'next/navigation';
import { InspectParticipantTypesSummary } from '@/app/participanttypedetails/inspect-participant-types-summary';
import Link from 'next/link';
import { EditParticipantTypeDialog } from '@/app/participanttypedetails/edit-participant-type-dialog';

export default function Page() {
  const searchParams = useSearchParams();
  const datasourceId = searchParams.get('datasource_id');
  const participantType = searchParams.get('participant_type');

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

  if (!datasourceId || !participantType) {
    return <Text>Error: Missing required parameters</Text>;
  }
  if (isLoading) {
    return <XSpinner message="Loading participant type details..." />;
  }
  if (error || !isHttpOk(data)) {
    return <Text>Error: {JSON.stringify(error)}</Text>;
  }

  // Sort fields only in the initial config, putting unique_id field at top
  if (data.type !== 'sheet') {
    const sortedFields = [...data.fields].sort((a, b) => {
      if (a.is_unique_id === b.is_unique_id) {
        return a.field_name.localeCompare(b.field_name);
      }
      return a.is_unique_id ? -1 : 1;
    });
    data.fields = sortedFields;
  }

  if (data.type === 'sheet') {
    return (
      <Flex direction="column" gap="3">
        <Heading>Participant Type Details: {participantType}</Heading>
        <Text>Sheet Reference Configuration:</Text>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="3">
      <Heading>Participant Type Details: {participantType}</Heading>
      <Text>
        Back to <Link href={`/datasourcedetails?id=${datasourceId}`}>Datasource</Link>
      </Text>
      <Flex gap={'3'}>
        <EditParticipantTypeDialog
          datasourceId={datasourceId}
          participantType={participantType}
          participantConfig={data}
        />
      </Flex>
      {inspectLoading || inspectValidating ? (
        <XSpinner message={`Inspecting participant type ${participantType}...`} />
      ) : (
        <InspectParticipantTypesSummary data={inspectData} />
      )}
    </Flex>
  );
}
