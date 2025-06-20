'use client';
import { useGetParticipantTypes, useInspectParticipantTypes } from '@/api/admin';
import { Button, Flex, Heading, Text } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { useParams } from 'next/navigation';
import { InspectParticipantTypesSummary } from '@/components/features/participants/inspect-participant-types-summary';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { Pencil2Icon } from '@radix-ui/react-icons';
import Link from 'next/link';

export default function Page() {
  const params = useParams();
  const datasourceId = params.datasourceId as string;
  const participantType = params.participantTypeId as string;

  const { data, isLoading, error } = useGetParticipantTypes(datasourceId!, participantType!, {
    swr: {
      enabled: datasourceId !== null && participantType !== null,
    },
  });
  const {
    data: inspectData,
    isLoading: inspectLoading,
    isValidating: inspectValidating,
  } = useInspectParticipantTypes(datasourceId!, participantType!, undefined, {
    swr: {
      enabled: datasourceId !== null && participantType !== null,
    },
  });

  if (!datasourceId || !participantType) {
    return <Text>Error: Missing required parameters</Text>;
  }
  if (isLoading) {
    return <XSpinner message="Loading participant type details..." />;
  }
  if (error) {
    return <GenericErrorCallout title={'Failed to fetch participant type details'} error={error} />;
  }
  if (!data) {
    return <GenericErrorCallout title={'Failed to fetch participant type details'} message={'data is missing'} />;
  }

  // Sort fields only in the initial config, putting unique_id field at top
  if (data.type !== 'sheet') {
    data.fields = [...data.fields].sort((a, b) => {
      if (a.is_unique_id === b.is_unique_id) {
        return a.field_name.localeCompare(b.field_name);
      }
      return a.is_unique_id ? -1 : 1;
    });
  }

  if (data.type === 'sheet') {
    return (
      <Flex direction="column" gap="6">
        <Flex align="start" direction="column" gap="3">
          <Heading size="8">Participant Type: {participantType}</Heading>
        </Flex>
        <Text>Sheet Reference Configuration:</Text>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <Flex justify="between" align="end" width="100%">
          <Heading size="8">Participant Type: {participantType}</Heading>
          {/* Only show edit button for schema types, not sheet types */}
          <Link href={`/datasources/${datasourceId}/participants/${participantType}/edit`}>
            <Button>
              <Pencil2Icon /> Edit Participant Type
            </Button>
          </Link>
        </Flex>
      </Flex>
      {inspectLoading || inspectValidating ? (
        <XSpinner message={`Inspecting participant type ${participantType}...`} />
      ) : (
        <InspectParticipantTypesSummary data={inspectData} />
      )}
    </Flex>
  );
}
