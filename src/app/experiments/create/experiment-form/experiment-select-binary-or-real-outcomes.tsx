import { ScreenProps } from '@/services/wizard/wizard-types';
import {
  ExperimentFormData,
  ExperimentScreenId,
  getMabDwhTarget,
} from '@/app/experiments/create/experiment-form/experiment-form-types';
import { Callout, Flex, Heading, RadioCards, Text } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { FormOutcomeType } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { outcomeTypeForTargetDataType } from '@/app/experiments/create/experiment-form/experiment-bandit-helpers';

type ExperimentSelectBinaryOrRealMessages = { type: 'set-outcome-type'; value: FormOutcomeType };

export const ExperimentSelectBinaryOrRealOutcomes = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentSelectBinaryOrRealMessages, ExperimentScreenId>) => {
  // A DWH target locks the outcome type to the column's type, so it can't disagree.
  const dwhTarget = getMabDwhTarget(data);
  const lockedOutcomeType = dwhTarget ? outcomeTypeForTargetDataType(dwhTarget.targetFieldType) : undefined;
  const locked = lockedOutcomeType !== undefined;

  return (
    <Flex direction="column" gap={'3'}>
      <Heading as="h3" size={'3'}>
        Select Outcome Type
      </Heading>
      {locked && (
        <Callout.Root>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Set by the target column <strong>{data.targetFieldName}</strong> ({data.targetFieldType}). Change the column
            on the Datasource step to change this.
          </Callout.Text>
        </Callout.Root>
      )}
      <RadioCards.Root
        value={data.bandit?.outcomeType}
        columns={{ initial: '1', sm: '3' }}
        onValueChange={(v) => {
          if (locked) return;
          dispatch({ type: 'set-outcome-type', value: v as FormOutcomeType });
        }}
      >
        <RadioCards.Item value="binary" disabled={locked}>
          <Flex direction="column" width="100%">
            <Text weight="bold">Binary</Text>
            <Text>
              Yes/No outcomes: conversions, clicks, sign-ups, purchases. Results are expressed as percentages or rates.
            </Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="real" disabled={locked}>
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
};
