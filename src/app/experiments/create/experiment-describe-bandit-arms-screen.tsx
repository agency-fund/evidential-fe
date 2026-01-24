import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form-def';
import { Flex } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';

type ExperimentsDescribeBanditArmsScreenMessage = { type: 'set'; value: string };

export const ExperimentDescribeBanditArmsScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsDescribeBanditArmsScreenMessage>) => (
  <Flex direction="column" gap="3">
    <WizardBreadcrumbs />
    <h2>Describe Bandit Arms</h2>
  </Flex>
);
