'use client';
import React, { useState } from 'react';
import { Box, Heading } from '@radix-ui/themes';
import { MABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { AdaptiveBreadcrumbs } from '@/components/features/experiments/adaptive-bread-crumbs';
import { WebhookSummary } from '@/api/methods.schemas';
import { MABDesignForm } from './mab-design-form';
import { MABMetadataForm } from './mab-metadata-form';
import { MABConfirmationForm } from '@/app/datasources/[datasourceId]/experiments/create/containers/mab/mab-confirmation-form';

interface MABContainerProps {
  webhooks: WebhookSummary[];
  initialFormData: MABFormData;
  onBack: () => void;
}

type MABStep = 'design' | 'metadata' | 'summary';

const STEP_TITLES = {
  design: 'Experiment Design',
  metadata: 'Experiment Metadata',
  summary: 'Experiment Summary',
} as const;

export function MABContainer({
  webhooks,
  initialFormData,
  onBack
}: MABContainerProps) {
  const [currentStep, setCurrentStep] = useState<MABStep>('design');
  const [formData, setFormData] = useState<MABFormData>(initialFormData);

  console.log('MABContainer - Initial formData:', initialFormData);
  console.log('MABContainer - Current formData:', formData);
  console.log('MABContainer - Experiment type:', formData.experimentType);

  // Calculate step number for breadcrumbs (1-based, includes type selection)
  const getStepNumber = () => {
    const stepMap = { design: 2, metadata: 3, summary: 4 };
    return stepMap[currentStep];
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'design':
        setCurrentStep('metadata');
        break;
      case 'metadata':
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

  const handleFormDataChange = (newData: MABFormData) => {
    setFormData(newData);
  };

  const renderCurrentStep = () => {
    console.log('🔍 CURRENT STEP:', currentStep);
    console.log('🔍 EXPERIMENT TYPE:', formData.experimentType);
    console.log('🔍 STEP NUMBER FOR BREADCRUMB:', getStepNumber());

    switch (currentStep) {
      case 'design':
        return (
          <MABDesignForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext} // This should set to 'metadata'
            onBack={handleBackStep}
          />
        );

      case 'metadata':
        return (
          <MABMetadataForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext} // This should set to 'summary'
            onBack={handleBackStep}
          />
        );

      case 'summary':
        return (
          <MABConfirmationForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
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
        experimentType="mab_online"
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
