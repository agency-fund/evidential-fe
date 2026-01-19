'use client';

import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Button, Flex, Heading, Text } from '@radix-ui/themes';
import { useParams } from 'next/navigation';

import { useListSnapshots } from '@/api/admin';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';
import Link from 'next/link';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { SnapshotTable } from './snapshot-table';

export default function SnapshotsPage() {
  const org = useCurrentOrganization();
  const organizationId = org!.current.id;
  const params = useParams();
  const datasourceId = params.datasourceId as string;
  const experimentId = params.experimentId as string;

  const {
    data: failedSnapshots,
    isLoading: failedLoading,
    error: failedError,
  } = useListSnapshots(
    organizationId,
    datasourceId,
    experimentId,
    { status: ['failed'] },
    {
      swr: { enabled: !!organizationId && !!datasourceId && !!experimentId },
    },
  );

  const {
    data: successSnapshots,
    isLoading: rsLoading,
    error: rsError,
  } = useListSnapshots(
    organizationId,
    datasourceId,
    experimentId,
    { status: ['success'] },
    {
      swr: { enabled: !!organizationId && !!datasourceId && !!experimentId },
    },
  );

  if (!datasourceId || !experimentId) {
    return <Text>Error: Missing datasource or experiment ID</Text>;
  }

  const isLoading = failedLoading || rsLoading;
  const error = failedError || rsError;

  if (isLoading) {
    return <XSpinner message="Loading snapshots..." />;
  }

  if (error) {
    return <GenericErrorCallout title="Failed to fetch snapshots" error={error} />;
  }

  const failedItems = failedSnapshots?.items ?? [];
  const successItems = successSnapshots?.items ?? [];

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
        {failedItems.length === 0 ? (
          <Text color="gray">No failed snapshots</Text>
        ) : (
          <SnapshotTable items={failedItems} showDetails={true} />
        )}
      </Flex>

      <Flex direction="column" gap="4">
        <Heading size="5">Successful Snapshots</Heading>
        {successItems.length === 0 ? <Text color="gray">No snapshots</Text> : <SnapshotTable items={successItems} />}
      </Flex>
    </Flex>
  );
}
