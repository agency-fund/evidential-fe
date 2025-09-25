'use client';

import { Table } from '@radix-ui/themes';
import { Arm, AssignSummary } from '@/api/methods.schemas';
import { ArmTableRow } from './arm-table-row';

interface ArmsAndAllocationsTableProps {
  arms: Arm[];
  assignSummary: AssignSummary;
  datasourceId: string;
  experimentId: string;
}

export function ArmsAndAllocationsTable({
  arms,
  assignSummary,
  datasourceId,
  experimentId,
}: ArmsAndAllocationsTableProps) {
 
  const sortedArms = [...arms].sort((a, b) => {
    if (!a.arm_id || !b.arm_id) return 0;
    return a.arm_id.localeCompare(b.arm_id);
  });

  return (
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Participants</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {sortedArms.map((arm) => (
          <ArmTableRow
            key={arm.arm_id}
            arm={arm}
            assignSummary={assignSummary}
            datasourceId={datasourceId}
            experimentId={experimentId}
          />
        ))}
      </Table.Body>
    </Table.Root>
  );
}


