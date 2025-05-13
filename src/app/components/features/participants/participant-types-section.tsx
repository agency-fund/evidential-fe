'use client';
import { Flex, Heading } from '@radix-ui/themes';
import { AddParticipantTypeDialog } from '@/app/components/features/participants/add-participant-type-dialog';
import { ParticipantTypesTable } from '@/app/components/features/participants/participant-types-table';

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
