import { Table } from '@radix-ui/themes';
import { Arm, AssignSummaryArmSizes } from '@/api/methods.schemas';
import { ArmsAndAllocationsTableRow } from './arms-and-allocations-table-row';

interface ArmsAndAllocationsTableProps {
  datasourceId: string;
  experimentId: string;
  arms: Arm[];
  sampleSize: number;
  armSizes?: AssignSummaryArmSizes;
}

export function ArmsAndAllocationsTable({
  datasourceId,
  experimentId,
  arms,
  sampleSize,
  armSizes,
}: ArmsAndAllocationsTableProps) {
  const sortedArms = [...arms].sort((a, b) => {
    if (!a.arm_id || !b.arm_id) return 0;
    return a.arm_id.localeCompare(b.arm_id);
  });
  const showClusterCounts = armSizes?.some((armSize) => armSize.cluster_count != null) ?? false;
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          {showClusterCounts && <Table.ColumnHeaderCell>Clusters</Table.ColumnHeaderCell>}
          <Table.ColumnHeaderCell>Participants</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Split</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedArms.map((arm) => {
          const armSizeEntry = armSizes?.find((a) => a.arm.arm_id === arm.arm_id);
          const armSize = armSizeEntry?.size || 0;
          const clusterCount = armSizeEntry?.cluster_count ?? undefined;
          const percentage = (armSize / sampleSize) * 100;
          return (
            <ArmsAndAllocationsTableRow
              key={arm.arm_id}
              datasourceId={datasourceId}
              experimentId={experimentId}
              arm={arm}
              armSize={armSize}
              clusterCount={clusterCount}
              showClusterCounts={showClusterCounts}
              percentage={percentage}
            />
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
