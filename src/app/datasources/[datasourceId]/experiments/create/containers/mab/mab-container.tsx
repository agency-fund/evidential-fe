'use client';
import React, { useState } from 'react';
import { Box, Heading } from '@radix-ui/themes';
import {
  MABFormData,
  CMABFormData,
  EXPERIMENT_STEP_FLOWS,
  STEP_TITLES,
} from '@/app/datasources/[datasourceId]/experiments/create/types';
import { AdaptiveBreadcrumbs } from '@/components/features/experiments/adaptive-bread-crumbs';
import { WebhookSummary } from '@/api/methods.schemas';
import { MABMetadataForm } from './mab-metadata-form';
import { MABConfirmationForm } from '@/app/datasources/[datasourceId]/experiments/create/containers/mab/mab-confirmation-form';

interface MABContainerProps {
  webhooks: WebhookSummary[];
  initialFormData: MABFormData | CMABFormData;
  onBack: () => void;
}

export function MABContainer({ webhooks, initialFormData, onBack }: MABContainerProps) {
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [formData, setFormData] = useState<MABFormData | CMABFormData>(initialFormData);
  const BanditSteps = EXPERIMENT_STEP_FLOWS[formData.experimentType];

  const handleNext = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBackStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleFormDataChange = (newData: MABFormData | CMABFormData) => {
    setFormData(newData);
  };

  const renderCurrentStep = () => {
    switch (BanditSteps[currentStep - 1]) {
      case 'metadata':
        return (
          <MABMetadataForm
            webhooks={webhooks}
            formData={formData as MABFormData | CMABFormData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext} // This should set to 'summary'
            onBack={onBack}
          />
        );

      case 'summary':
        return (
          <MABConfirmationForm
            formData={formData as MABFormData | CMABFormData}
            onFormDataChange={handleFormDataChange}
            onBack={handleBackStep}
            onNext={handleNext} // This should handle final submission
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
          {STEP_TITLES[BanditSteps[currentStep - 1]]}
        </Heading>
      </Box>

      {renderCurrentStep()}
    </Box>
  );
}
