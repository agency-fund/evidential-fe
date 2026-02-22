'use client';

import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Button, Flex, Heading, Text } from '@radix-ui/themes';
import { useParams } from 'next/navigation';

import Link from 'next/link';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { SnapshotTable } from './snapshot-table';

export default function SnapshotsPage() {
  const org = useCurrentOrganization();
  const organizationId = org!.current.id;
  const params = useParams();
  const datasourceId = params.datasourceId as string;
  const experimentId = params.experimentId as string;

  if (!datasourceId || !experimentId) {
    return <Text>Error: Missing datasource or experiment ID</Text>;
  }

  return (
    <Flex direction="column" gap="6">
      <Flex align="start" direction="column" gap="3">
        <Flex justify="between" align="end" width="100%">
          <Flex direction="row" align="center" gap="2">
            <Heading size="8">Snapshots</Heading>
          </Flex>

          <Flex gap={'3'}>
            <Link href={`/datasources/${datasourceId}/experiments/${experimentId}`}>
              <Button>
                <ArrowLeftIcon />
                Back to Experiment
              </Button>
            </Link>
            <Link href={`/datasources/${datasourceId}`}>
              <Button>Datasource Settings</Button>
            </Link>
          </Flex>
        </Flex>
      </Flex>

      <Flex direction="column" gap="4">
        <Heading size="5">Failed Snapshots</Heading>
        <SnapshotTable
          organizationId={organizationId}
          datasourceId={datasourceId}
          experimentId={experimentId}
          status="failed"
          showDetails={true}
          emptyMessage="No failed snapshots"
        />
      </Flex>

      <Flex direction="column" gap="4">
        <Heading size="5">Successful Snapshots</Heading>
        <SnapshotTable
          organizationId={organizationId}
          datasourceId={datasourceId}
          experimentId={experimentId}
          status="success"
          emptyMessage="No snapshots"
        />
      </Flex>
    </Flex>
  );
}
