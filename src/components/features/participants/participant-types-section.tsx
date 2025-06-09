'use client';
import { Button, Flex, Heading } from '@radix-ui/themes';
import { ParticipantTypesTable } from '@/components/features/participants/participant-types-table';
import { PlusIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export function ParticipantTypesSection({ datasourceId }: { datasourceId: string }) {
  return (
    <Flex direction="column" gap="3">
      <Flex justify="between">
        <Heading size="4">Participant Types</Heading>
        <Link href={`/datasources/${datasourceId}/participants/create`}>
          <Button>
            <PlusIcon /> Add Participant Type
          </Button>
        </Link>
      </Flex>
      <ParticipantTypesTable datasourceId={datasourceId} />
    </Flex>
  );
}
