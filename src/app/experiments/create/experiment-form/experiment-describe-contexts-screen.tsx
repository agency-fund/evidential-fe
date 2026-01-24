import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Flex } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';

type ExperimentDescribeContextsScreenMessage = { type: 'set'; value: string };

export const ExperimentDescribeContextsScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentDescribeContextsScreenMessage>) => (
  <Flex direction="column" gap="3">
    <WizardBreadcrumbs />
    <h2>Describe Contexts</h2>
  </Flex>
);
