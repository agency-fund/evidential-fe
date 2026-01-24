import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Flex } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';

type ExperimentDescribeWebhooksScreenMessage = { type: 'set'; value: string };

export const ExperimentDescribeWebhooksScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentDescribeWebhooksScreenMessage>) => (
  <Flex direction="column" gap="3">
    <WizardBreadcrumbs />
    <h2>Describe Webhooks</h2>
  </Flex>
);
