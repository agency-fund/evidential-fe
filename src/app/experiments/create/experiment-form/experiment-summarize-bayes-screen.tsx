import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form/experiment-form-def';
import { Preformatted } from '@/components/ui/preformatted';
import { Flex } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';

type ExperimentsSummarizeBayesScreenMessage = { type: 'set'; value: string };

export const ExperimentsSummarizeBayesScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsSummarizeBayesScreenMessage>) => (
  <Flex direction="column" gap="3">
    <WizardBreadcrumbs />
    <h2>Summary of Bayes Experiment</h2>
    <Preformatted content={data} />
  </Flex>
);
