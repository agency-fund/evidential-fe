import { ScreenProps } from '@/services/wizard/wizard-types';
import {
  ExperimentFormData,
  ExperimentScreenId,
  ExperimentType,
} from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Badge, Flex, RadioCards, Text } from '@radix-ui/themes';
import { ExperimentTypeOptions } from '@/app/experiments/create/experiment-form/experiment-form-helpers';

type ExperimentTypeMessage = { type: 'set-experiment-type'; value: ExperimentType };

export const ExperimentTypeScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentTypeMessage, ExperimentScreenId>) => (
  <Flex direction="column" gap={'3'}>
    <Text as="label" size="2" weight="bold" mb="6px">
      What type of experiment do you want to create?
    </Text>
    <RadioCards.Root
      defaultValue={data.experimentType}
      onValueChange={(v: ExperimentType) => dispatch({ type: 'set-experiment-type', value: v })}
      columns="2"
    >
      {ExperimentTypeOptions.map((option) => (
        <RadioCards.Item key={option.value} value={option.value}>
          <Flex direction="column" gap="1">
            <Flex align="center" gap="2">
              <Text weight="bold">{option.title}</Text>
              <Badge>{option.badge}</Badge>
            </Flex>
            <Text size="2" color="gray">
              {option.description}
            </Text>
          </Flex>
        </RadioCards.Item>
      ))}
    </RadioCards.Root>
  </Flex>
);
