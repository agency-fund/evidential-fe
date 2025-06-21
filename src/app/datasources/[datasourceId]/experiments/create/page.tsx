'use client';
import { useState } from 'react';
import { InitialForm } from '@/components/features/experiments/initial-form';
import { DesignForm } from '@/components/features/experiments/design-form';
import { ConfirmationForm } from '@/components/features/experiments/confirmation-form';
import { Box, Container, Flex, Heading } from '@radix-ui/themes';
import { Arm, CreateExperimentResponse, Filter, PowerResponseOutput } from '@/api/methods.schemas';
import { useParams } from 'next/navigation';

export type MetricWithMDE = {
  metricName: string;
  mde: string; // desired minimum detectable effect as a percentage of the metric's baseline value
};

export type ExperimentFormData = {
  datasourceId?: string;
  participantType?: string;
  experimentType: string;
  name: string;
  hypothesis: string;
  startDate: string;
  endDate: string;
  arms: Omit<Arm, 'arm_id'>[];
  primaryMetric?: MetricWithMDE;
  secondaryMetrics: MetricWithMDE[];
  filters: Filter[];
  // These next 2 Experiment Parameters are strings to allow for empty values,
  // which should be converted to numbers when making power or experiment creation requests.
  confidence: string;
  power: string;
  // Selected webhook IDs for notifications
  selectedWebhookIds: string[];
  // Populated when user clicks "Power Check" on DesignForm
  chosenN?: number;
  powerCheckResponse?: PowerResponseOutput;
  // Populated when assignments are created by pressing "Next" on DesignForm
  experimentId?: string;
  createExperimentResponse?: CreateExperimentResponse;
};

const reasonableStartDate = () => {
  const date = new Date();
  date.setDate(0);
  date.setMonth(date.getMonth() + 2);
  return date.toISOString().split('T')[0];
};

const reasonableEndDate = () => {
  const date = new Date();
  date.setDate(0);
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().split('T')[0];
};

export default function CreateExperimentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const params = useParams();
  const [formData, setFormData] = useState<ExperimentFormData>({
    datasourceId: params.datasourceId as string,
    experimentType: 'preassigned',
    name: 'My Experiment',
    hypothesis: 'To the moon!',
    startDate: reasonableStartDate(),
    endDate: reasonableEndDate(),
    arms: [
      {
        arm_name: 'Control',
        arm_description: 'No change. (Your Arm 1 will be used as baseline for comparison in analysis.)',
      },
      { arm_name: 'Treatment', arm_description: 'Change' },
    ],
    // primaryMetric will be undefined initially
    secondaryMetrics: [],
    filters: [],
    confidence: '95',
    power: '80',
    selectedWebhookIds: [],
  });
  console.log('formData', formData);

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFormDataChange = (data: ExperimentFormData) => {
    // Determine if we need to invalidate the power check response
    if (formData.powerCheckResponse) {
      const filtersChanged =
        formData.filters.length !== data.filters.length ||
        formData.filters.some(
          (filter, i) =>
            data.filters[i]?.field_name !== filter.field_name ||
            data.filters[i]?.relation !== filter.relation ||
            JSON.stringify(filter.value) !== JSON.stringify(data.filters[i]?.value),
        );

      const primaryMetricChanged =
        formData.primaryMetric?.metricName !== data.primaryMetric?.metricName ||
        formData.primaryMetric?.mde !== data.primaryMetric?.mde;

      const secondaryMetricsChanged =
        formData.secondaryMetrics.length !== data.secondaryMetrics.length ||
        formData.secondaryMetrics.some(
          (metric, i) =>
            data.secondaryMetrics[i]?.metricName !== metric.metricName || data.secondaryMetrics[i]?.mde !== metric.mde,
        );

      const shouldInvalidatePowerCheck =
        filtersChanged ||
        primaryMetricChanged ||
        secondaryMetricsChanged ||
        formData.confidence !== data.confidence ||
        formData.power !== data.power;

      // Only reset if we have a previous power check response and need to invalidate it
      const newData = shouldInvalidatePowerCheck ? { ...data, powerCheckResponse: undefined } : data;
      setFormData(newData);
    } else {
      setFormData(data);
    }
  };

  return (
    <Container>
      <Flex direction="column" gap="4">
        <Heading size="8">
          {{ 1: 'Experiment Metadata', 2: 'Experiment Design', 3: 'Experiment Summary' }[currentStep]}
        </Heading>
        <Box>
          {currentStep === 1 && <InitialForm formData={formData} onFormDataChange={setFormData} onNext={handleNext} />}
          {currentStep === 2 && (
            <DesignForm
              formData={formData}
              onFormDataChange={handleFormDataChange}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <ConfirmationForm formData={formData} onFormDataChange={setFormData} onBack={handleBack} />
          )}
        </Box>
      </Flex>
    </Container>
  );
}
