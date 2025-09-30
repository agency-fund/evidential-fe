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
  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell width="30%">Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell width="70%">Description</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedArms.map((arm) => {
          const armSize = armSizes?.find((a) => a.arm.arm_id === arm.arm_id)?.size || 0;
          const percentage = (armSize / sampleSize) * 100;
          return (
            <ArmsAndAllocationsTableRow
              key={arm.arm_id}
              datasourceId={datasourceId}
              experimentId={experimentId}
              arm={arm}
              armSize={armSize}
              percentage={percentage}
            />
          );
        })}
      </Table.Body>
    </Table.Root>
  );
}
