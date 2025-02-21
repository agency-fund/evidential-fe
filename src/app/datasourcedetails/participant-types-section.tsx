'use client';
import { Flex, Heading, Spinner, Text } from '@radix-ui/themes';
import { useListApiKeys } from '@/api/admin';
import { isHttpOk } from '@/services/typehelper';
import { CreateApiKeyDialog } from '@/app/datasourcedetails/create-api-key-dialog';
import { ApiKeysTable } from '@/app/datasourcedetails/api-keys-table';
import { AddParticipantTypeDialog } from '@/app/datasourcedetails/add-participant-type-dialog';
import { ParticipantTypesTable } from '@/app/datasourcedetails/participant-types-table';

export function ParticipantTypesSection({ datasourceId }: { datasourceId: string }) {
  return (
    <Flex direction="column" gap="3">
      <Flex justify="between">
        <Heading size="4">Participant Types</Heading>
        <AddParticipantTypeDialog datasourceId={datasourceId} />
      </Flex>
      <ParticipantTypesTable datasourceId={datasourceId} />
    </Flex>
  );
}
