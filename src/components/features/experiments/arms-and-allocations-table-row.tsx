import { Table, Flex, Heading, Badge, Text } from '@radix-ui/themes';
import { PersonIcon } from '@radix-ui/react-icons';
import { useUpdateArm, getGetExperimentForUiKey } from '@/api/admin';
import { UpdateArmRequest, Arm } from '@/api/methods.schemas';
import { EditableTextField } from '@/components/ui/inputs/editable-text-field';
import { EditableTextArea } from '@/components/ui/inputs/editable-text-area';
import { useSWRConfig } from 'swr';
import { ReadMoreText } from '@/components/ui/read-more-text';

interface ArmsAndAllocationsTableRowProps {
  datasourceId: string;
  experimentId: string;
  arm: Arm;
  armSize: number;
  percentage: number;
}

export function ArmsAndAllocationsTableRow({
  datasourceId,
  experimentId,
  arm,
  armSize,
  percentage,
}: ArmsAndAllocationsTableRowProps) {
  const { mutate } = useSWRConfig();
  const { trigger: updateArm } = useUpdateArm(datasourceId, experimentId, arm.arm_id!);

  const makeHandleUpdateArm = (field: keyof UpdateArmRequest) => {
    return async (value: string) => {
      await updateArm({
        [field]: value,
      });
      await mutate(getGetExperimentForUiKey(datasourceId, experimentId));
    };
  };

  return (
    <Table.Row>
      <Table.Cell width="20%">
        <Flex direction="column" gap="4" align="start">
          <Flex gap="2" align="center">
            <EditableTextField value={arm.arm_name} onSubmit={makeHandleUpdateArm('name')} size="1">
              <Heading size="2">{arm.arm_name}</Heading>
            </EditableTextField>
          </Flex>
          <Flex direction="column" gap="3" align="start">
            <Badge>
              <PersonIcon />
              <Text>{armSize.toLocaleString()} participants</Text>
            </Badge>
            <Badge>{percentage.toFixed(1)}%</Badge>
          </Flex>
        </Flex>
      </Table.Cell>
      <Table.Cell width="80%">
        <EditableTextArea
          value={arm.arm_description || 'No description'}
          onSubmit={makeHandleUpdateArm('description')}
          size="1"
        >
         <ReadMoreText text={arm.arm_description || 'No description'} />
        </EditableTextArea>
      </Table.Cell>
    </Table.Row>
  );
}
