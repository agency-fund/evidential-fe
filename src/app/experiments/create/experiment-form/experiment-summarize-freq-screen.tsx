import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Preformatted } from '@/components/ui/preformatted';
import { Flex } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';

type ExperimentsSummarizeFreqScreenMessage = { type: 'set'; value: string };

export const ExperimentsSummarizeFreqScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsSummarizeFreqScreenMessage>) => (
  <Flex direction="column" gap="3">
    <WizardBreadcrumbs />
    <h2>Summary of Freq Experiment</h2>
    <Preformatted content={data} />
  </Flex>
);
