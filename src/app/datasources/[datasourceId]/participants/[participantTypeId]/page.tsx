'use client';
import { useGetParticipantType, useInspectParticipantTypes } from '@/api/admin';
import { Button, Callout, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { useParams } from 'next/navigation';
import { InspectParticipantTypesSummary } from '@/components/features/participants/inspect-participant-types-summary';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { InfoCircledIcon, Pencil2Icon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { ParticipantDriftTable } from '@/components/features/participants/participant-drift-table';
import FieldDataCard from '@/components/ui/cards/field-data-card';

export default function Page() {
  const params = useParams();
  const datasourceId = params.datasourceId as string;
  const participantType = params.participantTypeId as string;

  const { data, isLoading, error } = useGetParticipantType(datasourceId!, participantType!, {
    swr: {
      enabled: datasourceId !== null && participantType !== null,
    },
  });
  const {
    data: inspectData,
    isLoading: inspectLoading,
    isValidating: inspectValidating,
    error: inspectError,
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
    return <GenericErrorCallout title={'Failed to fetch participant type'} error={error} />;
  }
  if (!data) {
    return <GenericErrorCallout title={'Failed to fetch participant type'} message={'data is missing'} />;
  }

  // Sort fields only in the initial config, putting unique_id field at top
  data.proposed.fields = [...data.proposed.fields].sort((a, b) => {
    if (a.is_unique_id === b.is_unique_id) {
      return a.field_name.localeCompare(b.field_name);
    }
    return a.is_unique_id ? -1 : 1;
  });

  const proposedUnusedFields = data.proposed.fields.filter(
    (field) => !field.is_metric && !field.is_filter && !field.is_strata && !field.is_unique_id,
  ).length;

  const uniqueIdField = data.proposed.fields.find((field) => field.is_unique_id);

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <Flex justify="between" align="end" width="100%">
          <Heading size="8">Participant Type: {data.proposed.participant_type}</Heading>
          <Link href={`/datasources/${datasourceId}/participants/${participantType}/edit`}>
            <Button>
              <Pencil2Icon /> Edit Participant Type
            </Button>
          </Link>
        </Flex>
      </Flex>

      <Heading>Datasource Table: {data.proposed.table_name}</Heading>

      <ParticipantDriftTable drift={data.drift} />

      {proposedUnusedFields > 0 && (
        <Callout.Root color={'blue'}>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            {proposedUnusedFields} field(s) in the underlying table have not been marked for use (metric, filter,
            stratum, or unique_id). Edit the participant type for details.
          </Callout.Text>
        </Callout.Root>
      )}

      <Flex direction="column" gap="4">
        <Heading size="4">Unique ID Field</Heading>
        <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="4">
          {uniqueIdField ? (
            <FieldDataCard field={uniqueIdField} key={uniqueIdField.field_name} />
          ) : (
            <Text color="gray" size="4">
              <em>Not set</em>
            </Text>
          )}
        </Grid>
      </Flex>

      {inspectError && <GenericErrorCallout title={'Failed to fetch participant type details'} error={inspectError} />}

      {inspectLoading || inspectValidating ? (
        <XSpinner message={`Inspecting participant type ${participantType}...`} />
      ) : (
        inspectData && <InspectParticipantTypesSummary data={inspectData} />
      )}
    </Flex>
  );
}
