'use client';
import React, { useState } from 'react';
import { Container, Flex, Heading, Box, Text } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import {
  ExperimentType,
  isFreqExperimentType,
  ExperimentFormData,
  FrequentABFormData,
  MABFormData,
  CMABFormData,
} from '@/app/datasources/[datasourceId]/experiments/create/types';
import { WebhookSummary } from '@/api/methods.schemas';
import { ExperimentTypeSelector } from '@/components/features/experiments/experiment-type-selector';
import { FrequentABContainer } from '@/app/datasources/[datasourceId]/experiments/create/containers/frequent_ab/frequent-ab-container';
import { MABContainer } from '@/app/datasources/[datasourceId]/experiments/create/containers/mab/mab-container';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { useGetDatasource } from '@/api/admin';

interface CreateExperimentContainerProps {
  webhooks: WebhookSummary[];
}

export function CreateExperimentContainer({ webhooks }: CreateExperimentContainerProps) {
  const params = useParams();
  const datasourceId = params.datasourceId as string;
  const { data } = useGetDatasource(datasourceId);
  const dsDriver = data?.dsn.type;

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
              arm_name: 'Control',
              arm_description: 'Control',
              alpha_prior: 1,
              beta_prior: 1,
            },
            {
              arm_name: 'Treatment',
              arm_description: 'Treatment',
              alpha_prior: 2,
              beta_prior: 1,
            },
          ],
        } as MABFormData;

      case 'cmab_online':
        return {
          ...baseData,
          experimentType: 'cmab_online',
          priorType: 'normal',
          arms: [
            {
              arm_name: 'Control',
              arm_description: 'Control',
              mean_prior: 0,
              stddev_prior: 1,
            },
            {
              arm_name: 'Treatment',
              arm_description: 'Treatment',
              mean_prior: 1,
              stddev_prior: 1,
            },
          ],
          contexts: [
            {
              name: 'Context Name',
              description: 'Context Description',
              type: 'real-valued',
            },
          ],
        } as CMABFormData;

      default:
        throw new Error(`Unsupported experiment type: ${experimentType}`);
    }
  };

  const handleExperimentTypeSelect = (type: ExperimentType) => {
    setSelectedExperimentType(type);
    setShowTypeSelection(false);
  };

  const handleContinue = () => {
    if (selectedExperimentType && !isFreqExperimentType(selectedExperimentType)) {
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
      case 'cmab_online':
        return (
          <MABContainer
            webhooks={webhooks}
            initialFormData={initialFormData as MABFormData | CMABFormData}
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
            <Text color="gray" size="3" mb="0">
              Choose the type of experiment you want to create
            </Text>
          </Box>

          <ExperimentTypeSelector
            dsDriver={dsDriver || 'none'}
            selectedType={selectedExperimentType}
            onTypeSelect={handleExperimentTypeSelect}
          />

          <NavigationButtons
            onNext={
              selectedExperimentType && !isFreqExperimentType(selectedExperimentType) ? handleContinue : undefined
            }
            nextLabel="Continue"
            nextDisabled={!selectedExperimentType || isFreqExperimentType(selectedExperimentType)}
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
