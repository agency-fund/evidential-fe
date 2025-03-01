'use client';
import { useState } from 'react';
import { InitialForm } from './initial-form';
import { DesignForm } from './design-form';
import { ConfirmationForm } from './confirmation-form';
import { Box, Container, Flex, Heading } from '@radix-ui/themes';
import { Arm, AssignSummary, AudienceSpecFilter, PowerResponseOutput } from '@/api/methods.schemas';
import { useSearchParams } from 'next/navigation';

export type ExperimentFormData = {
  name: string;
  hypothesis: string;
  startDate: string;
  endDate: string;
  arms: Omit<Arm, 'arm_id'>[];
  datasourceId?: string;
  participantType?: string;
  primaryMetric?: string;
  secondaryMetrics: string[];
  filters: AudienceSpecFilter[];
  confidence: number;
  power: number;
  effectPctChange: number;
  // Populated when user clicks "Power Check" on DesignForm
  chosenN?: number;
  powerCheckResponse?: PowerResponseOutput;
  // Populated when assignments are created by pressing "Next" on DesignForm
  experimentId?: string;
  assignSummary?: AssignSummary;
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
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<ExperimentFormData>({
    name: 'My Experiment',
    datasourceId: searchParams.get('datasource_id') || '',
    hypothesis: 'To the moon!',
    startDate: reasonableStartDate(),
    endDate: reasonableEndDate(),
    arms: [
      { arm_name: 'Control', arm_description: 'No change' },
      { arm_name: 'Treatment', arm_description: 'Change' },
    ],
    secondaryMetrics: [],
    filters: [],
    confidence: 95,
    power: 80,
    effectPctChange: 10,
  });
  console.log('formData', formData);

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Container>
      <Flex direction="column" gap="4">
        <Heading>{{ 1: 'Experiment Metadata', 2: 'Experiment Design', 3: 'Experiment Summary' }[currentStep]}</Heading>
        <Box>
          {currentStep === 1 && <InitialForm formData={formData} onFormDataChange={setFormData} onNext={handleNext} />}
          {currentStep === 2 && (
            <DesignForm formData={formData} onFormDataChange={setFormData} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && (
            <ConfirmationForm formData={formData} onFormDataChange={setFormData} onBack={handleBack} />
          )}
        </Box>
      </Flex>
    </Container>
  );
}
