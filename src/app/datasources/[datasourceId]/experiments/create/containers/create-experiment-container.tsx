'use client';
import React, { useState } from 'react';
import { Container, Flex, Heading, Box } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import {
  ExperimentType,
  ExperimentFormData,
  FrequentABFormData,
  MABFormData,
} from '@/app/datasources/[datasourceId]/experiments/create/types';
import { WebhookSummary } from '@/api/methods.schemas';
import { ExperimentTypeSelector } from '@/components/features/experiments/experiment-type-selector';
import { FrequentABContainer } from '@/app/datasources/[datasourceId]/experiments/create/containers/frequent_ab/frequent-ab-container';
import { MABContainer } from '@/app/datasources/[datasourceId]/experiments/create/containers/mab/mab-container';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';

interface CreateExperimentContainerProps {
  webhooks: WebhookSummary[];
}

export function CreateExperimentContainer({ webhooks }: CreateExperimentContainerProps) {
  const params = useParams();
  const datasourceId = params.datasourceId as string;

  const [selectedExperimentType, setSelectedExperimentType] = useState<ExperimentType>();
  const [showTypeSelection, setShowTypeSelection] = useState(true);

  // Helper function to create initial form data for each experiment type
  const createInitialFormData = (experimentType: ExperimentType): ExperimentFormData => {
    const baseData = {
      datasourceId,
      experimentType,
      name: 'My Experiment',
      hypothesis: 'Hypothesis.',
      startDate: getReasonableStartDate(),
      endDate: getReasonableEndDate(),
      selectedWebhookIds: webhooks.length === 1 ? [webhooks[0].id] : [],
    };

    switch (experimentType) {
      case 'freq_preassigned':
      case 'freq_online':
        return {
          ...baseData,
          experimentType: experimentType,
          arms: [
            { arm_name: 'Control', arm_description: 'Control' },
            { arm_name: 'Treatment', arm_description: 'Treatment' },
          ],
          secondaryMetrics: [],
          filters: [],
          confidence: '95',
          power: '80',
        } as FrequentABFormData;

      case 'mab_online':
        return {
          ...baseData,
          experimentType: 'mab_online',
          priorType: 'beta',
          outcomeType: 'binary',
          arms: [
            {
              arm_name: 'Current Button',
              arm_description: 'Existing blue "Sign Up" button',
              alpha_prior: 1,
              beta_prior: 1,
            },
            {
              arm_name: 'Green Button',
              arm_description: 'Green "Join Now" button with larger size',
              alpha_prior: 2,
              beta_prior: 1,
            },
          ],
        } as MABFormData;

      default:
        throw new Error(`Unsupported experiment type: ${experimentType}`);
    }
  };

  const handleExperimentTypeSelect = (type: ExperimentType) => {
    setSelectedExperimentType(type);
    setShowTypeSelection(false);
  };

  const handleContinue = () => {
    if (selectedExperimentType && !selectedExperimentType.includes('freq')) {
      setShowTypeSelection(false);
    }
  };

  const handleBackToTypeSelection = () => {
    setShowTypeSelection(true);
    setSelectedExperimentType(undefined);
  };

  const renderExperimentFlow = () => {
    if (!selectedExperimentType) return null;

    const initialFormData = createInitialFormData(selectedExperimentType);

    switch (selectedExperimentType) {
      case 'freq_online':
      case 'freq_preassigned':
        return (
          <FrequentABContainer
            webhooks={webhooks}
            initialFormData={initialFormData as FrequentABFormData}
            onBack={handleBackToTypeSelection}
          />
        );

      case 'mab_online':
        return (
          <MABContainer
            webhooks={webhooks}
            initialFormData={initialFormData as MABFormData}
            onBack={handleBackToTypeSelection}
          />
        );
      default:
        return null;
    }
  };

  if (showTypeSelection) {
    return (
      <Container>
        <Flex direction="column" gap="6">
          <Box>
            <Heading size="8" mb="2">
              Create Experiment
            </Heading>
            <p style={{ color: 'var(--gray-11)', fontSize: '16px', margin: 0 }}>
              Choose the type of experiment you want to create
            </p>
          </Box>

          <ExperimentTypeSelector selectedType={selectedExperimentType} onTypeSelect={handleExperimentTypeSelect} />

          <NavigationButtons
            onNext={selectedExperimentType && !selectedExperimentType.includes('freq') ? handleContinue : undefined}
            nextLabel="Continue"
            nextDisabled={!selectedExperimentType || selectedExperimentType.includes('freq')}
            showBack={false}
          />
        </Flex>
      </Container>
    );
  }

  return (
    <Container>
      <Flex direction="column" gap="4">
        {renderExperimentFlow()}
      </Flex>
    </Container>
  );
}

// Helper functions
function getReasonableStartDate(): string {
  const date = new Date();
  date.setDate(0);
  date.setMonth(date.getMonth() + 2);
  return date.toISOString().split('T')[0];
}

function getReasonableEndDate(): string {
  const date = new Date();
  date.setDate(0);
  date.setMonth(date.getMonth() + 3);
  return date.toISOString().split('T')[0];
}
