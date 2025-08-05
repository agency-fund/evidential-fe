'use client';
import React, { useState } from 'react';
import { Box, Heading } from '@radix-ui/themes';
import { FrequentABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
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

type FrequentABStep = 'metadata' | 'design' | 'summary';

const STEP_TITLES = {
  metadata: 'Experiment Metadata',
  design: 'Experiment Design',
  summary: 'Experiment Summary',
} as const;

export function FrequentABContainer({
  webhooks,
  initialFormData,
  onBack
}: FrequentABContainerProps) {
  const [currentStep, setCurrentStep] = useState<FrequentABStep>('metadata');
  const [formData, setFormData] = useState<FrequentABFormData>(initialFormData);

  // Calculate step number for breadcrumbs (1-based, includes type selection)
  const getStepNumber = () => {
    const stepMap = { metadata: 2, design: 3, summary: 4 };
    return stepMap[currentStep];
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'metadata':
        setCurrentStep('design');
        break;
      case 'design':
        setCurrentStep('summary');
        break;
      case 'summary':
        // Handle final submission
        break;
    }
  };

  const handleBackStep = () => {
    switch (currentStep) {
      case 'design':
        onBack(); // Go back to experiment type selection
        break;
      case 'metadata':
        setCurrentStep('design');
        break;
      case 'summary':
        setCurrentStep('metadata');
        break;
    }
  };

  const handleFormDataChange = (newData: FrequentABFormData) => {
    setFormData(prev => ({ ...prev, ...newData }));
  };


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'metadata':
        return (
          <InitialForm
            formData={formData}
            onFormDataChange={(data) => handleFormDataChange(data as FrequentABFormData)}
            onNext={handleNext}
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
      <AdaptiveBreadcrumbs
        experimentType={formData.experimentType}
        currentStep={getStepNumber()}
      />

      <Box mb="6">
        <Heading size="8" mb="2">
          {STEP_TITLES[currentStep]}
        </Heading>
      </Box>

      {renderCurrentStep()}
    </Box>
  );
}
