import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form-def';
import { Preformatted } from '@/components/ui/preformatted';

type ExperimentsSummarizeFreqScreenMessage = { type: 'set'; value: string };

export const ExperimentsSummarizeFreqScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentsSummarizeFreqScreenMessage>) => (
  <>
    <h2>Summary of Freq Experiment</h2>
    <Preformatted content={data} />
  </>
);
