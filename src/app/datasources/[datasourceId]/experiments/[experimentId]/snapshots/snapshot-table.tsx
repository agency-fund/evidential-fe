'use client';
import { Badge, Button, Code, Flex, Select, Table, Text } from '@radix-ui/themes';

import { useListSnapshots } from '@/api/admin';
import { Snapshot, SnapshotDetails, SnapshotStatus } from '@/api/methods.schemas';
import { Preformatted } from '@/components/ui/preformatted';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

const DEFAULT_PAGE_SIZE = '10';
const PAGE_SIZE_OPTIONS = ['10', '50', '100'] as const;

type SnapshotPageSize = (typeof PAGE_SIZE_OPTIONS)[number];

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

const isSnapshotPageSize = (value: string): value is SnapshotPageSize =>
  PAGE_SIZE_OPTIONS.includes(value as SnapshotPageSize);

const getSnapshotTableKey = ({ organizationId, datasourceId, experimentId, status }: SnapshotTableProps): string =>
  `${status}:${organizationId ?? ''}:${datasourceId ?? ''}:${experimentId ?? ''}`;

function SnapshotTableImpl({
  organizationId,
  datasourceId,
  experimentId,
  status,
  showDetails = false,
  emptyMessage = 'No snapshots',
}: SnapshotTableProps) {
  const [snapshotPageTokens, setSnapshotPageTokens] = useState<string[]>(['']);
  const [snapshotPageSize, setSnapshotPageSize] = useState<SnapshotPageSize>(DEFAULT_PAGE_SIZE);

  const currentPageToken = snapshotPageTokens[snapshotPageTokens.length - 1];

  const {
    data: snapshotsData,
    isLoading,
    error,
  } = useListSnapshots(
    organizationId ?? '',
    datasourceId ?? '',
    experimentId ?? '',
    { status: [status], page_size: Number(snapshotPageSize), page_token: currentPageToken },
    {
      swr: {
        keepPreviousData: true,
        enabled: !!organizationId && !!datasourceId && !!experimentId,
      },
    },
  );

  const snapshots = snapshotsData?.items ?? [];
  const nextPageToken = snapshotsData?.next_page_token || '';

  const canGoToPreviousPage = snapshotPageTokens.length > 1 && !isLoading;
  const canGoToNextPage = !!nextPageToken && !isLoading;

  const goToPreviousPage = () => {
    setSnapshotPageTokens((previousTokens) => {
      if (previousTokens.length <= 1) {
        return previousTokens;
      }

      return previousTokens.slice(0, -1);
    });
  };

  const goToNextPage = () => {
    if (!nextPageToken) {
      return;
    }

    setSnapshotPageTokens((previousTokens) => [...previousTokens, nextPageToken]);
  };

  const setPageSize = (value: string) => {
    if (!isSnapshotPageSize(value)) {
      return;
    }

    setSnapshotPageSize(value);
    setSnapshotPageTokens(['']);
  };

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
        <Select.Root value={snapshotPageSize} onValueChange={setPageSize} size="1">
          <Select.Trigger />
          <Select.Content position="popper">
            {PAGE_SIZE_OPTIONS.map((option) => (
              <Select.Item key={option} value={option}>
                {option}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Button
          size="1"
          variant="soft"
          color="gray"
          onClick={goToPreviousPage}
          disabled={!canGoToPreviousPage}
          loading={isLoading}
        >
          <ChevronLeftIcon />
          Prev
        </Button>
        <Button
          size="1"
          variant="soft"
          color="gray"
          onClick={goToNextPage}
          disabled={!canGoToNextPage}
          loading={isLoading}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </Flex>
    </Flex>
  );
}

export function SnapshotTable(props: SnapshotTableProps) {
  // Wrapping SnapshotTableImpl and adding a key= avoids needing a useEffect to clear pagination tokens.
  return <SnapshotTableImpl key={getSnapshotTableKey(props)} {...props} />;
}
