import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form-def';

type ExperimentDescribeWebhooksScreenMessage = { type: 'set'; value: string };

export const ExperimentDescribeWebhooksScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentDescribeWebhooksScreenMessage>) => (
  <>
    <h2>Describe Webhooks</h2>
  </>
);
