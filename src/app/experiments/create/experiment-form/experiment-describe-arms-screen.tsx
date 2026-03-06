'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Badge, Box, Button, Card, Flex, Heading, IconButton, Text, TextArea, TextField } from '@radix-ui/themes';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';
import { ArmWeightsDialog } from '@/components/features/experiments/arm-weights-dialog';

export type ExperimentDescribeArmsMessage =
  | { type: 'add-arm' }
  | { type: 'remove-arm'; index: number }
  | { type: 'update-arm'; index: number; field: 'arm_name' | 'arm_description'; value: string }
  | { type: 'set-weights'; weights: number[] };

export const ExperimentDescribeArmsScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentDescribeArmsMessage, ExperimentScreenId>) => {
  const arms = data.arms ?? [];
  const showArmsError = arms.length > 0 && arms.length < 2;

  return (
    <Flex direction="column" gap={'3'}>
      <Flex justify="between" align="start">
        <Flex direction="column" gap="1">
          <Heading size="4">Arms</Heading>
          {showArmsError && (
            <Text size="1" color="red">
              At least two arms are required
            </Text>
          )}
        </Flex>
        <ArmWeightsDialog arms={arms} onWeightsChange={(weights) => dispatch({ type: 'set-weights', weights })} />
      </Flex>

      <Flex direction="column" gap={'2'}>
        {arms.map((arm, index) => (
          <Card key={index}>
            <Flex direction="column" gap={'2'}>
              <Flex justify="between" align="center">
                <Flex direction="row" gap="2" align="baseline">
                  <Text size="3" weight="bold">
                    Arm {index + 1} {index === 0 && '(control)'}
                  </Text>
                  {arm.arm_weight != null && <Badge>{arm.arm_weight.toFixed(1)}%</Badge>}
                </Flex>
                <IconButton size="1" color="red" variant="soft" onClick={() => dispatch({ type: 'remove-arm', index })}>
                  <TrashIcon />
                </IconButton>
              </Flex>

              <Flex direction="column" gap={'2'}>
                <Box maxWidth="50%">
                  <Text as="label" size="2" weight="bold">
                    Arm Name
                  </Text>
                  <TextField.Root
                    value={arm.arm_name}
                    placeholder="Arm Name"
                    onChange={(e) => dispatch({ type: 'update-arm', index, field: 'arm_name', value: e.target.value })}
                    required
                  />
                </Box>
              </Flex>

              <Flex direction="column" gap={'2'}>
                <Text as="label" size="2" weight="bold">
                  Arm Description
                </Text>
                <TextArea
                  placeholder="Description"
                  value={arm.arm_description || ''}
                  onChange={(e) =>
                    dispatch({ type: 'update-arm', index, field: 'arm_description', value: e.target.value })
                  }
                />
              </Flex>
            </Flex>
          </Card>
        ))}

        <Flex justify="end" mt="4">
          <Button type="button" onClick={() => dispatch({ type: 'add-arm' })}>
            <PlusIcon /> Add Arm
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
