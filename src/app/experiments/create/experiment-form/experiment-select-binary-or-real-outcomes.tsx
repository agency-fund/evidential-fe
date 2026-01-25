import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Flex, RadioCards, Text } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';

type ExperimentSelectBinaryOrRealMessages = { type: 'set-outcome-type'; value: 'binary' | 'real' };

export const ExperimentSelectBinaryOrRealOutcomes = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentSelectBinaryOrRealMessages>) => (
  <Flex direction="column" gap={'3'}>
    <WizardBreadcrumbs />
    <h2>Select Outcome Type</h2>
    <RadioCards.Root
      defaultValue={data.outcomeType}
      columns={{ initial: '1', sm: '3' }}
      onValueChange={(v) => dispatch({ type: 'set-outcome-type', value: v as 'binary' | 'real' })}
    >
      <RadioCards.Item value="binary">
        <Flex direction="column" width="100%">
          <Text weight="bold">Binary</Text>
          <Text>01010101</Text>
        </Flex>
      </RadioCards.Item>
      <RadioCards.Item value="real">
        <Flex direction="column" width="100%">
          <Text weight="bold">Real</Text>
          <Text>3.141592654</Text>
        </Flex>
      </RadioCards.Item>
    </RadioCards.Root>
  </Flex>
);
