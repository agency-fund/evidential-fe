import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form-def';
import { Flex } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';

type ExperimentFreqStackScreenMessage = { type: 'set'; value: string };

export const ExperimentFreqStackScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentFreqStackScreenMessage>) => (
  <Flex direction="column" gap="3">
    <WizardBreadcrumbs />
    <h2>Describe Freq Experiment</h2>
  </Flex>
);
