'use client';
import { ParticipantsDef } from '@/api/methods.schemas';
import {
  getGetDatasourceKey,
  getGetParticipantTypesKey,
  getInspectParticipantTypesKey,
  getListParticipantTypesKey,
  useGetParticipantTypes,
  useUpdateParticipantType,
} from '@/api/admin';
import { useState } from 'react';
import { mutate } from 'swr';
import { Button, Flex, Heading, Separator, Text } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { ParticipantFieldsEditor } from '@/components/features/participants/participant-fields-editor';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { useParams, useRouter } from 'next/navigation';
import { BackButton } from '@/components/ui/buttons/back-button';

export default function EditParticipantTypePage() {
  const params = useParams();
  const router = useRouter();
  const datasourceId = params.datasourceId as string;
  const participantType = params.participantTypeId as string;

  const {
    data: participantConfig,
    isLoading,
    error,
  } = useGetParticipantTypes(datasourceId!, participantType!, {
    swr: {
      enabled: datasourceId !== null && participantType !== null,
    },
  });

  const {
    trigger: updateParticipantType,
    isMutating,
    error: updateError,
    reset,
  } = useUpdateParticipantType(datasourceId, participantType, {
    swr: {
      onSuccess: async () => {
        await Promise.all([
          mutate(getGetDatasourceKey(datasourceId)),
          mutate(getGetParticipantTypesKey(datasourceId, participantType)),
          mutate(getInspectParticipantTypesKey(datasourceId, participantType, {})),
          mutate(getListParticipantTypesKey(datasourceId)),
        ]);
        router.push(`/datasources/${datasourceId}/participants/${participantType}`);
      },
    },
  });

  const [editedDef, setEditedDef] = useState<ParticipantsDef | null>(null);

  if (!datasourceId || !participantType) {
    return <Text>Error: Missing required parameters</Text>;
  }

  if (isLoading) {
    return <XSpinner message="Loading participant type details..." />;
  }

  if (error) {
    return <GenericErrorCallout title={'Failed to fetch participant type details'} error={error} />;
  }

  if (!participantConfig) {
    return <GenericErrorCallout title={'Failed to fetch participant type details'} message={'data is missing'} />;
  }

  // Check if this is a sheet type - sheets cannot be edited
  if (participantConfig.type === 'sheet') {
    return (
      <Flex direction="column" gap="6">
        <Flex align="start" direction="column" gap="3">
          <BackButton
            href={`/datasources/${datasourceId}/participants/${participantType}`}
            label="Back to Participant Type"
          />
          <Separator my="3" size="4" />
          <Heading size="8">Edit Participant Type: {participantType}</Heading>
        </Flex>
        <GenericErrorCallout
          title="Cannot Edit Sheet Participant Type"
          message="Sheet participant types cannot be edited through this interface. They are managed through the source spreadsheet."
        />
      </Flex>
    );
  }

  const handleSave = async () => {
    if (!editedDef) return;

    // Clear any previous errors
    reset();

    await updateParticipantType({
      fields: editedDef.fields,
    });
  };

  const handleCancel = () => {
    router.push(`/datasources/${datasourceId}/participants/${participantType}`);
  };

  const handleFieldsChange = (fields: typeof participantConfig.fields) => {
    setEditedDef({
      ...participantConfig,
      fields,
    });
  };

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <BackButton
          href={`/datasources/${datasourceId}/participants/${participantType}`}
          label="Back to Participant Type"
        />
        <Separator my="3" size="4" />
        <Heading size="8">Edit Participant Type: {participantType}</Heading>
      </Flex>

      {isMutating ? (
        <XSpinner message={'Saving...'} />
      ) : (
        <>
          {updateError && (
            <Flex mb="4">
              <GenericErrorCallout title="Failed to update participant type" error={updateError} />
            </Flex>
          )}

          <ParticipantFieldsEditor
            fields={(editedDef || participantConfig).fields}
            onFieldsChange={handleFieldsChange}
            allowFieldRemoval={false}
          />

          <Flex gap="3" mt="4" justify="end">
            <Button variant="soft" color="gray" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!editedDef}>
              Save Changes
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  );
}
