import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form-def';

type ExperimentsDescribeBanditArmsScreenMessage = { type: 'set'; value: string };

export const ExperimentDescribeBanditArmsScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsDescribeBanditArmsScreenMessage>) => (
  <>
    <h2>Describe Bandit Arms</h2>
  </>
);
