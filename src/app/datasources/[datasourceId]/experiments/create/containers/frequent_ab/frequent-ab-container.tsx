'use client';
import React, { useState } from 'react';
import { Box, Heading } from '@radix-ui/themes';
import {
  FrequentABFormData,
  STEP_TITLES,
  EXPERIMENT_STEP_FLOWS,
} from '@/app/datasources/[datasourceId]/experiments/create/types';
import { AdaptiveBreadcrumbs } from '@/components/features/experiments/adaptive-bread-crumbs';
import { InitialForm } from '@/components/features/experiments/initial-form';
import { DesignForm } from '@/app/datasources/[datasourceId]/experiments/create/containers/frequent_ab/design-form';
import { ConfirmationForm } from '@/components/features/experiments/confirmation-form';
import { WebhookSummary } from '@/api/methods.schemas';

interface FrequentABContainerProps {
  webhooks: WebhookSummary[];
  initialFormData: FrequentABFormData;
  onBack: () => void;
}

export function FrequentABContainer({ webhooks, initialFormData, onBack }: FrequentABContainerProps) {
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [formData, setFormData] = useState<FrequentABFormData>(initialFormData);
  const FreqSteps = EXPERIMENT_STEP_FLOWS['freq_online'];

  const handleNext = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBackStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleFormDataChange = (newData: FrequentABFormData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const renderCurrentStep = () => {
    switch (FreqSteps[currentStep - 1]) {
      case 'metadata':
        return (
          <InitialForm
            formData={formData}
            onFormDataChange={(data) => handleFormDataChange(data as FrequentABFormData)}
            onNext={handleNext}
            onBack={onBack}
            webhooks={webhooks}
          />
        );

      case 'design':
        return (
          <DesignForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBackStep}
          />
        );

      case 'summary':
        return (
          <ConfirmationForm
            formData={formData}
            onFormDataChange={(data) => handleFormDataChange(data as FrequentABFormData)}
            onBack={handleBackStep}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <AdaptiveBreadcrumbs experimentType={formData.experimentType} currentStep={currentStep} />

      <Box mb="6">
        <Heading size="8" mb="2">
          {STEP_TITLES[FreqSteps[currentStep - 1]]}
        </Heading>
      </Box>

      {renderCurrentStep()}
    </Box>
  );
}
