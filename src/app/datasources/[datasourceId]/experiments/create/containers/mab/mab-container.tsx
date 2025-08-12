'use client';
import React, { useState } from 'react';
import { Box, Heading } from '@radix-ui/themes';
import {
  MABFormData,
  EXPERIMENT_STEP_FLOWS,
  STEP_TITLES,
} from '@/app/datasources/[datasourceId]/experiments/create/types';
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

export function MABContainer({ webhooks, initialFormData, onBack }: MABContainerProps) {
  const [currentStep, setCurrentStep] = useState<number>(2);
  const [formData, setFormData] = useState<MABFormData>(initialFormData);
  const MABSteps = EXPERIMENT_STEP_FLOWS['mab_online'];

  const handleNext = () => {
    setCurrentStep((prevStep) => prevStep + 1);
  };

  const handleBackStep = () => {
    setCurrentStep((prevStep) => prevStep - 1);
  };

  const handleFormDataChange = (newData: MABFormData) => {
    setFormData(newData);
  };

  const renderCurrentStep = () => {
    switch (MABSteps[currentStep - 1]) {
      case 'design':
        return (
          <MABDesignForm
            formData={formData}
            onFormDataChange={handleFormDataChange}
            onNext={handleNext} // This should set to 'metadata'
            onBack={onBack}
          />
        );

      case 'metadata':
        return (
          <MABMetadataForm
            webhooks={webhooks}
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
            onNext={handleNext} // This should handle final submission
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <AdaptiveBreadcrumbs experimentType="mab_online" currentStep={currentStep} />

      <Box mb="6">
        <Heading size="8" mb="2">
          {STEP_TITLES[MABSteps[currentStep - 1]]}
        </Heading>
      </Box>

      {renderCurrentStep()}
    </Box>
  );
}
