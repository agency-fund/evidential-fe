import { Table, Flex, Heading, Badge, Text } from '@radix-ui/themes';
import { PersonIcon } from '@radix-ui/react-icons';
import { useUpdateArm } from '@/api/admin';
import { UpdateArmRequest, Arm } from '@/api/methods.schemas';
import { EditableTextField } from '@/components/ui/inputs/editable-text-field';
import { EditableTextArea } from '@/components/ui/inputs/editable-text-area';

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
  const { trigger: updateArm } = useUpdateArm(datasourceId, experimentId, arm.arm_id!, { swr: { revalidate: false } });

  const handleUpdateArm = (field: keyof UpdateArmRequest) => {
    return async (value: string) => {
      try {
        await updateArm({
          [field]: value,
        });
      } catch (err) {
        throw err;
      }
    };
  };

  return (
    <Table.Row>
      <Table.Cell width="20%">
        <Flex direction="column" gap="4" align="start">
          <Flex gap="2" align="center">
            <EditableTextField name="name" defaultValue={arm.arm_name} onSubmit={handleUpdateArm('name')} size="1">
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
          name="description"
          defaultValue={arm.arm_description || 'No description'}
          onSubmit={handleUpdateArm('description')}
          size="1"
          readMore={true}
        />
      </Table.Cell>
    </Table.Row>
  );
}
