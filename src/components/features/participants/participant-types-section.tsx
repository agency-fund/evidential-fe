'use client';
import { Flex, Heading } from '@radix-ui/themes';
import { ParticipantTypesTable } from '@/components/features/participants/participant-types-table';

export function ParticipantTypesSection({ datasourceId }: { datasourceId: string }) {
  return (
    <Flex direction="column" gap="3">
      <Flex justify="between">
        <Heading size="4">Participant Types (deprecated)</Heading>
      </Flex>
      <ParticipantTypesTable datasourceId={datasourceId} />
    </Flex>
  );
}
