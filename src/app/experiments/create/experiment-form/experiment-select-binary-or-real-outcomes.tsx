import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Flex, Heading, RadioCards, Text } from '@radix-ui/themes';
import { FormOutcomeType } from '@/app/experiments/create/experiment-form/experiment-form-types';

type ExperimentSelectBinaryOrRealMessages = { type: 'set-outcome-type'; value: FormOutcomeType };

export const ExperimentSelectBinaryOrRealOutcomes = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentSelectBinaryOrRealMessages, ExperimentScreenId>) => (
  <Flex direction="column" gap={'3'}>
    <Heading as="h3" size={'3'}>
      Select Outcome Type
    </Heading>
    <RadioCards.Root
      value={data.bandit?.outcomeType}
      columns={{ initial: '1', sm: '3' }}
      onValueChange={(v) => dispatch({ type: 'set-outcome-type', value: v as FormOutcomeType })}
    >
      <RadioCards.Item value="binary">
        <Flex direction="column" width="100%">
          <Text weight="bold">Binary</Text>
          <Text>
            Yes/No outcomes: conversions, clicks, sign-ups, purchases. Results are expressed as percentages or rates.
          </Text>
        </Flex>
      </RadioCards.Item>
      <RadioCards.Item value="real">
        <Flex direction="column" width="100%">
          <Text weight="bold">Real-valued</Text>
          <Text>
            Continuous numeric outcomes: revenue per user, time spent, satisfaction scores, any measurable quantity.
          </Text>
        </Flex>
      </RadioCards.Item>
    </RadioCards.Root>
  </Flex>
);
