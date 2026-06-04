'use client';
import { Badge, Code, Flex, Table, Text } from '@radix-ui/themes';

import { useListSnapshots } from '@/api/admin';
import { Snapshot, SnapshotDetails, SnapshotStatus } from '@/api/methods.schemas';
import { usePagination } from '@/providers/use-pagination';
import { Preformatted } from '@/components/ui/preformatted';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';
import { PaginationButtons } from '@/components/ui/pagination/pagination-buttons';

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

const getDetailsContent = (details: Exclude<SnapshotDetails, null>): string | Record<string, unknown> => {
  if ('message' in details && Object.keys(details).length === 1) {
    return typeof details.message === 'string' ? details.message : details;
  }
  return details;
};

interface SnapshotTableProps {
  organizationId?: string;
  datasourceId?: string;
  experimentId?: string;
  status: SnapshotStatus;
  showDetails?: boolean;
  emptyMessage?: string;
}

const getSnapshotTableKey = ({ organizationId, datasourceId, experimentId, status }: SnapshotTableProps): string =>
  `${status}:${organizationId ?? ''}:${datasourceId ?? ''}:${experimentId ?? ''}`;

export function SnapshotTable({
  organizationId,
  datasourceId,
  experimentId,
  status,
  showDetails = false,
  emptyMessage = 'No snapshots',
}: SnapshotTableProps) {
  const pagination = usePagination({
    resetKey: getSnapshotTableKey({ organizationId, datasourceId, experimentId, status }),
  });

  const {
    data: snapshotsData,
    isLoading,
    error,
  } = useListSnapshots(
    organizationId ?? '',
    datasourceId ?? '',
    experimentId ?? '',
    { status: [status], page_size: pagination.pageSize, page_token: pagination.currentPageToken },
    {
      swr: {
        keepPreviousData: true,
        enabled: !!organizationId && !!datasourceId && !!experimentId,
      },
    },
  );

  const snapshots = snapshotsData?.items ?? [];
  const nextPageToken = snapshotsData?.next_page_token || '';

  if (!organizationId || !datasourceId || !experimentId) {
    return (
      <Text color="gray" size="2">
        Missing snapshot context
      </Text>
    );
  }

  if (error) {
    return <GenericErrorCallout title="Failed to fetch snapshots" error={error as Error} />;
  }

  if (snapshotsData === undefined) {
    return <XSpinner message="Loading snapshots..." />;
  }

  if (snapshots.length === 0) {
    return <Text color="gray">{emptyMessage}</Text>;
  }

  return (
    <Flex direction="column" gap="2">
      <Table.Root variant="surface">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Snapshot ID</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Updated</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Duration</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
            {showDetails && <Table.ColumnHeaderCell>Details</Table.ColumnHeaderCell>}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {snapshots.map((snapshot) => (
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
              {showDetails && (
                <Table.Cell>
                  {snapshot.details ? (
                    <Preformatted content={getDetailsContent(snapshot.details)} />
                  ) : (
                    <Text color="gray">-</Text>
                  )}
                </Table.Cell>
              )}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Flex justify="end" gap="2">
        <PaginationButtons pagination={pagination} isLoading={isLoading} nextPageToken={nextPageToken} />
      </Flex>
    </Flex>
  );
}
