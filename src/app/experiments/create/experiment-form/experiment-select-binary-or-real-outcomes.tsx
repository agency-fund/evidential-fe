import { useState } from 'react';
import { ScreenProps } from '@/services/wizard/wizard-types';
import {
  ExperimentFormData,
  ExperimentScreenId,
  getMabDwhTarget,
} from '@/app/experiments/create/experiment-form/experiment-form-types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { Callout, Flex, Heading, RadioCards, Switch, Text, TextField } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { LikelihoodTypes } from '@/api/methods.schemas';
import { outcomeTypeForTargetDataType } from '@/app/experiments/create/experiment-form/experiment-bandit-helpers';

type ExperimentSelectBinaryOrRealMessages =
  | { type: 'set-outcome-type'; value: LikelihoodTypes }
  | { type: 'set-autofail-enabled'; value: boolean }
  | { type: 'set-autofail-window'; value: number | undefined }
  | { type: 'set-autofail-outcome-value'; value: number | undefined };

export const ExperimentSelectBinaryOrRealOutcomes = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentSelectBinaryOrRealMessages, ExperimentScreenId>) => {
  // A DWH target locks the outcome type to the column's type, so it can't disagree.
  const dwhTarget = getMabDwhTarget(data);
  const lockedOutcomeType = dwhTarget ? outcomeTypeForTargetDataType(dwhTarget.targetFieldType) : undefined;
  const locked = lockedOutcomeType !== undefined;

  const autofailEnabled = data.autofail?.enableAutofail === true;

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
          dispatch({ type: 'set-outcome-type', value: v as LikelihoodTypes });
        }}
      >
        <RadioCards.Item value="binary" disabled={locked && lockedOutcomeType !== 'binary'}>
          <Flex direction="column" width="100%">
            <Text weight="bold">Binary</Text>
            <Text>
              Yes/No outcomes: conversions, clicks, sign-ups, purchases. Results are expressed as percentages or rates.
            </Text>
          </Flex>
        </RadioCards.Item>
        <RadioCards.Item value="real-valued" disabled={locked && lockedOutcomeType !== 'real-valued'}>
          <Flex direction="column" width="100%">
            <Text weight="bold">Real-valued</Text>
            <Text>
              Continuous numeric outcomes: revenue per user, time spent, satisfaction scores, any measurable quantity.
            </Text>
          </Flex>
        </RadioCards.Item>
      </RadioCards.Root>

      <Heading as="h3" size={'3'} mt="2">
        Autofail Settings
      </Heading>
      <Flex direction="column" gap="1">
        <Text as="label" size="2">
          <Flex gap="2" align="center">
            <Switch
              checked={autofailEnabled}
              onCheckedChange={(checked) => dispatch({ type: 'set-autofail-enabled', value: checked })}
            />
            Enable autofail
          </Flex>
        </Text>
        <Text size="1" color="gray">
          Enable automatically filling in outcome values for participants do not complete the experiment within a
          specified time window.
        </Text>
      </Flex>
      {autofailEnabled && (
        <Flex direction="row" gap="4">
          <Flex direction="column" gap="1" flexGrow="1">
            <Text as="label" size="2" weight="medium">
              Autofail time window (hours)
            </Text>
            <TextField.Root
              type="number"
              value={data.autofail?.autofailWindow ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'set-autofail-window',
                  value: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
            <Text size="1" color="gray">
              The time window after which participants who have not completed the experiment will be automatically
              assigned an outcome value.
            </Text>
          </Flex>
          <Flex direction="column" gap="1" flexGrow="1">
            <Text as="label" size="2" weight="medium">
              Autofail outcome value
            </Text>
            <TextField.Root
              type="number"
              value={data.autofail?.autofailOutcomeValue ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'set-autofail-outcome-value',
                  value: e.target.value === '' ? undefined : Number(e.target.value),
                })
              }
            />
            <Text size="1" color="gray">
              The outcome value that will be automatically assigned to participants who do not complete the experiment
              within the specified time window.
            </Text>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};
