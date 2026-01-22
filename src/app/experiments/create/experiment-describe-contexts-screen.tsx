import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form-def';

type ExperimentDescribeContextsScreenMessage = { type: 'set'; value: string };

export const ExperimentDescribeContextsScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentDescribeContextsScreenMessage>) => (
  <>
    <h2>Describe Contexts</h2>
  </>
);
