import { Badge, Code, Table, Text } from '@radix-ui/themes';

import { Snapshot, SnapshotDetails } from '@/api/methods.schemas';
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

const getDetailsContent = (details: Exclude<SnapshotDetails, null>): string | Record<string, unknown> => {
  if ('message' in details && Object.keys(details).length === 1) {
    return typeof details.message === 'string' ? details.message : details;
  }
  return details;
};

interface SnapshotTableProps {
  items: Snapshot[];
  showDetails?: boolean;
}

export function SnapshotTable({ items, showDetails = false }: SnapshotTableProps) {
  return (
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
        {items.map((snapshot) => (
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
  );
}
