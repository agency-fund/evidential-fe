'use client';

import {
  Badge,
  Flex,
  Table,
  Text,
} from '@radix-ui/themes';
import { PersonIcon } from '@radix-ui/react-icons';
import { useUpdateArm, getGetExperimentForUiKey } from '@/api/admin';
import { EditableTextField } from '@/components/ui/inputs/editable/editable-text-field';
import { EditableTextArea } from '@/components/ui/inputs/editable/editable-text-area';
import { UpdateArmRequest, Arm, AssignSummary } from '@/api/methods.schemas';
import { mutate } from 'swr';

interface ArmTableRowProps {
  arm: Arm;
  assignSummary: AssignSummary;
  datasourceId: string;
  experimentId: string;
}

export function ArmTableRow({
  arm,
  assignSummary,
  datasourceId,
  experimentId,
}: ArmTableRowProps) {
  const armSize = assignSummary.arm_sizes?.find((a) => a.arm.arm_id === arm.arm_id)?.size || 0;
  const percentage = (armSize / assignSummary.sample_size) * 100;

  const {
    trigger: triggerUpdateArm,
    isMutating: isUpdatingArm,
  } = useUpdateArm(datasourceId, experimentId, arm.arm_id!, {
    swr: {
      onSuccess: () => mutate(getGetExperimentForUiKey(datasourceId, experimentId))
    }
  });

  const handleArmUpdate = async (
    fieldKey: keyof UpdateArmRequest,
    newValue: string,
    currentValue: string,
  ) => {
    if (newValue.trim() && newValue !== currentValue) {
      const payload = { [fieldKey]: newValue.trim() };
      await triggerUpdateArm(payload);
    }
  };

  return (
    <Table.Row>
      <Table.Cell>
        <EditableTextField
          initialValue={arm.arm_name}
          fieldKey="name"
          headingSize="2"
          textFieldSize="2"
          onUpdate={async (formData) => {
            const newName = formData.get('name') as string;
            await handleArmUpdate('name', newName, arm.arm_name);
          }}
          isUpdating={isUpdatingArm}
        />
      </Table.Cell>
      <Table.Cell>
        <EditableTextArea
          initialValue={arm.arm_description || ''}
          fieldKey="description"
          textAreaSize="1"
          onUpdate={async (formData) => {
            const newDescription = formData.get('description') as string;
            await handleArmUpdate('description', newDescription, arm.arm_description || '');
          }}
          isUpdating={isUpdatingArm}
          readMore={true}
        />
      </Table.Cell>
      <Table.Cell>
        <Flex direction="column" gap="3" align="start">
          <Badge>
            <PersonIcon />
            <Text>{armSize.toLocaleString()} participants</Text>
          </Badge>
          <Badge>{percentage.toFixed(1)}%</Badge>
        </Flex>
      </Table.Cell>
      <Table.Cell>

      </Table.Cell>
    </Table.Row>
  );
}