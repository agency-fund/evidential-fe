'use client';
import React, { useState } from 'react';
import { Box, Heading } from '@radix-ui/themes';
import { BayesianABFormData } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { AdaptiveBreadcrumbs } from '@/components/features/experiments/adaptive-bread-crumbs';
import { WebhookSummary } from '@/api/methods.schemas';
import { BayesianABDesignForm } from './bayesian-ab-design-form';
import { BayesianABMetadataForm } from './bayesian-ab-metadata-form';
import { BayesianABConfirmationForm } from './bayesian-ab-confirmation-form';

interface BayesianABContainerProps {
  webhooks: WebhookSummary[];
  initialFormData: BayesianABFormData;
  onBack: () => void;
}

type BayesianABStep = 'design' | 'metadata' | 'summary';

const STEP_TITLES = {
  design: 'Bayesian Design',
  metadata: 'Experiment Metadata', 
  summary: 'Experiment Summary',
} as const;

export function BayesianABContainer({ 
  webhooks, 
  initialFormData, 
  onBack
}: BayesianABContainerProps) {
  const [currentStep, setCurrentStep] = useState<BayesianABStep>('design');
  const [formData, setFormData] = useState<BayesianABFormData>(initialFormData);

  console.log('BayesianABContainer - Initial formData:', initialFormData);
  console.log('BayesianABContainer - Current formData:', formData);
  console.log('BayesianABContainer - Experiment type:', formData.experimentType);

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

  const handleFormDataChange = (newData: BayesianABFormData) => {
    setFormData(newData);
  };

  const renderCurrentStep = () => {
    console.log('🔍 CURRENT STEP:', currentStep);
    console.log('🔍 EXPERIMENT TYPE:', formData.experimentType);
    console.log('🔍 STEP NUMBER FOR BREADCRUMB:', getStepNumber());
    
    switch (currentStep) {
      case 'design':
        return (
          <BayesianABDesignForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBackStep}
          />
        );
        
      case 'metadata':
        return (
          <BayesianABMetadataForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBackStep}
          />
        );
        
      case 'summary':
        return (
          <BayesianABConfirmationForm
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
        experimentType="bayesian_ab"
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