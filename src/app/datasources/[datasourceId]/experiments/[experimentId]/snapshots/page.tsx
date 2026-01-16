'use client';

import { ArrowLeftIcon } from '@radix-ui/react-icons';
import { Badge, Button, Code, Flex, Heading, Table, Text } from '@radix-ui/themes';
import { useParams } from 'next/navigation';

import { useListSnapshots } from '@/api/admin';
import { Snapshot } from '@/api/methods.schemas';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';
import Link from 'next/link';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { Preformatted } from '@/components/ui/preformatted';

const formatDuration = (createdAt: string, updatedAt: string): string => {
  const created = new Date(createdAt);
  const updated = new Date(updatedAt);
  const diffMs = updated.getTime() - created.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 1) return `< 1s`;
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  const remainingSec = diffSec % 60;
  if (diffMin < 60) return `${diffMin}m ${remainingSec}s`;
  const diffHour = Math.floor(diffMin / 60);
  const remainingMin = diffMin % 60;
  return `${diffHour}h ${remainingMin}m`;
};

const getStatusColor = (status: Snapshot['status']): 'red' | 'yellow' | 'green' => {
  switch (status) {
    case 'failed':
      return 'red';
    case 'running':
      return 'yellow';
    case 'success':
      return 'green';
  }
};

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
    data: runningSuccessSnapshots,
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
  const runningSuccessItems = runningSuccessSnapshots?.items ?? [];

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
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Snapshot ID</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {failedItems.map((snapshot) => (
                <Table.Row key={snapshot.id}>
                  <Table.Cell>
                    <Code>{snapshot.id}</Code>
                  </Table.Cell>
                  <Table.Cell>{new Date(snapshot.created_at).toLocaleString()}</Table.Cell>
                  <Table.Cell>{new Date(snapshot.updated_at).toLocaleString()}</Table.Cell>
                  <Table.Cell>{formatDuration(snapshot.created_at, snapshot.updated_at)}</Table.Cell>
                  <Table.Cell>
                    <Badge color={getStatusColor(snapshot.status)}>{snapshot.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {snapshot.details ? <Preformatted content={snapshot.details} /> : <Text color="gray">-</Text>}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Flex>

      <Flex direction="column" gap="4">
        <Heading size="5">Successful Snapshots</Heading>
        {runningSuccessItems.length === 0 ? (
          <Text color="gray">No snapshots</Text>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Snapshot ID</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {runningSuccessItems.map((snapshot) => (
                <Table.Row key={snapshot.id}>
                  <Table.Cell>
                    <Code>{snapshot.id}</Code>
                  </Table.Cell>
                  <Table.Cell>{new Date(snapshot.created_at).toLocaleString()}</Table.Cell>
                  <Table.Cell>{new Date(snapshot.updated_at).toLocaleString()}</Table.Cell>
                  <Table.Cell>{formatDuration(snapshot.created_at, snapshot.updated_at)}</Table.Cell>
                  <Table.Cell>
                    <Badge color={getStatusColor(snapshot.status)}>{snapshot.status}</Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Flex>
    </Flex>
  );
}
