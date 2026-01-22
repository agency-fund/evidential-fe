import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form-def';

type ExperimentFreqStackScreenMessage = { type: 'set'; value: string };

export const ExperimentFreqStackScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentFreqStackScreenMessage>) => (
  <>
    <h2>Describe Freq Experiment</h2>
  </>
);
