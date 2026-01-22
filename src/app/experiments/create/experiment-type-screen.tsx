import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentType } from '@/app/experiments/create/experiment-form-def';
import { Select } from '@radix-ui/themes';
import {
  CMABExperimentSpecInputExperimentType,
  FreqExperimentAnalysisResponseType,
  MABExperimentSpecInputExperimentType,
  OnlineFrequentistExperimentSpecInputExperimentType,
  PreassignedFrequentistExperimentSpecInputExperimentType,
} from '@/api/methods.schemas';

type ExperimentTypeMessage = { type: 'set-experiment-type'; value: ExperimentType };

export const ExperimentTypeScreen = ({ data, dispatch }: ScreenProps<ExperimentFormData, ExperimentTypeMessage>) => (
  <>
    <h2>Experiment Type</h2>
    <Select.Root
      defaultValue={data.experimentType}
      onValueChange={(v: ExperimentType) => dispatch({ type: 'set-experiment-type', value: v })}
    >
      <Select.Trigger />
      <Select.Content>
        <Select.Group>
          <Select.Label>Frequentist</Select.Label>
          <Select.Item value={PreassignedFrequentistExperimentSpecInputExperimentType.freq_preassigned}>
            {FreqExperimentAnalysisResponseType.freq}
          </Select.Item>
          <Select.Item value={OnlineFrequentistExperimentSpecInputExperimentType.freq_online}>
            {OnlineFrequentistExperimentSpecInputExperimentType.freq_online}
          </Select.Item>
        </Select.Group>
        <Select.Group>
          <Select.Label>Bayesian</Select.Label>
          <Select.Item value={MABExperimentSpecInputExperimentType.mab_online}>
            {MABExperimentSpecInputExperimentType.mab_online}
          </Select.Item>
          <Select.Item value={CMABExperimentSpecInputExperimentType.cmab_online}>
            {CMABExperimentSpecInputExperimentType.cmab_online}
          </Select.Item>
        </Select.Group>
      </Select.Content>
    </Select.Root>
  </>
);
