'use client';
import React, { useState } from 'react';
import { Box, Heading } from '@radix-ui/themes';
import { CMABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { AdaptiveBreadcrumbs } from '@/components/features/experiments/adaptive-bread-crumbs';
import { WebhookSummary } from '@/api/methods.schemas';
import { CMABContextForm } from './cmab-context-form';
import { CMABDesignForm } from './cmab-design-form';
import { CMABMetadataForm } from './cmab-metadata-form';
import { CMABConfirmationForm } from './cmab-confirmation-form';

interface CMABContainerProps {
  webhooks: WebhookSummary[];
  initialFormData: CMABFormData;
  onBack: () => void;
}

type CMABStep = 'context' | 'design' | 'metadata' | 'summary';

const STEP_TITLES = {
  context: 'Context Variables',
  design: 'Experiment Design',
  metadata: 'Experiment Metadata', 
  summary: 'Experiment Summary',
} as const;

export function CMABContainer({ 
  webhooks, 
  initialFormData, 
  onBack
}: CMABContainerProps) {
  const [currentStep, setCurrentStep] = useState<CMABStep>('context');
  const [formData, setFormData] = useState<CMABFormData>(initialFormData);

  console.log('CMABContainer - Initial formData:', initialFormData);
  console.log('CMABContainer - Current formData:', formData);
  console.log('CMABContainer - Experiment type:', formData.experimentType);

  // Calculate step number for breadcrumbs (1-based, includes type selection)
  const getStepNumber = () => {
    const stepMap = { context: 2, design: 3, metadata: 4, summary: 5 };
    return stepMap[currentStep];
  };

  const handleNext = () => {
    switch (currentStep) {
      case 'context':
        setCurrentStep('design');
        break;
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
      case 'context':
        onBack(); // Go back to experiment type selection
        break;
      case 'design':
        setCurrentStep('context');
        break;
      case 'metadata':
        setCurrentStep('design');
        break;
      case 'summary':
        setCurrentStep('metadata');
        break;
    }
  };

  const handleFormDataChange = (newData: CMABFormData) => {
    setFormData(newData);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'context':
        return (
          <CMABContextForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBackStep}
          />
        );

      case 'design':
        return (
          <CMABDesignForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBackStep}
          />
        );
        
      case 'metadata':
        return (
          <CMABMetadataForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBackStep}
          />
        );
        
      case 'summary':
        return (
          <CMABConfirmationForm
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
        experimentType="contextual_bandit"
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