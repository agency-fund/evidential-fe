'use client';
import React, { useState } from 'react';
import { Container, Flex, Heading, Box } from '@radix-ui/themes';
import { useParams } from 'next/navigation';
import { 
  ExperimentType, 
  ExperimentFormData, 
  FrequentABFormData,
  MABFormData,
  BayesianABFormData,
  CMABFormData,
  AssignmentType
} from '@/app/datasources/[datasourceId]/experiments/create/types';
import { WebhookSummary } from '@/api/methods.schemas';
import { ExperimentTypeSelector } from '@/components/features/experiments/experiment-type-selector';
import { FrequentABContainer } from '@/app/datasources/[datasourceId]/experiments/create/containers/frequent_ab/frequent-ab-container';
import { MABContainer } from '@/app/datasources/[datasourceId]/experiments/create/containers/mab/mab-container';
import { BayesianABContainer } from '@/app/datasources/[datasourceId]/experiments/create/containers/bayesian_ab/bayesian-ab-container';
import { CMABContainer } from '@/app/datasources/[datasourceId]/experiments/create/containers/cmab/cmab-container';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';

interface CreateExperimentContainerProps {
  webhooks: WebhookSummary[];
}

export function CreateExperimentContainer({ webhooks }: CreateExperimentContainerProps) {
  const params = useParams();
  const datasourceId = params.datasourceId as string;
  
  const [selectedExperimentType, setSelectedExperimentType] = useState<ExperimentType>();
  const [selectedAssignmentType, setSelectedAssignmentType] = useState<AssignmentType>();
  const [showTypeSelection, setShowTypeSelection] = useState(true);

  // Helper function to create initial form data for each experiment type
  const createInitialFormData = (experimentType: ExperimentType, assignmentType?: AssignmentType): ExperimentFormData => {
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
      case 'frequent_ab':
        return {
          ...baseData,
          experimentType: 'frequent_ab',
          assignmentType: assignmentType || 'preassigned',
          arms: [
            { arm_name: 'Control', arm_description: 'Control' },
            { arm_name: 'Treatment', arm_description: 'Treatment' },
          ],
          secondaryMetrics: [],
          filters: [],
          confidence: '95',
          power: '80',
        } as FrequentABFormData;

      case 'multi_armed_bandit':
        return {
          ...baseData,
          experimentType: 'multi_armed_bandit',
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

      case 'bayesian_ab':
        return {
          ...baseData,
          experimentType: 'bayesian_ab',
          priorType: 'normal',
          outcomeType: 'binary',
          arms: [
            { 
              arm_name: 'Control', 
              arm_description: 'Original version',
              mean_prior: 0,
              stddev_prior: 1,
            },
            { 
              arm_name: 'Treatment', 
              arm_description: 'New version',
              mean_prior: 0,
              stddev_prior: 1,
            },
          ],
        } as BayesianABFormData;

      case 'contextual_bandit':
        return {
          ...baseData,
          experimentType: 'contextual_bandit',
          priorType: 'normal',
          outcomeType: 'binary',
          contextVariables: [
            {
              name: 'device_type',
              description: 'Whether the user is on mobile or desktop device',
              type: 'binary'
            }
          ],
          arms: [
            { 
              arm_name: 'Control', 
              arm_description: 'Original version',
              mean_prior: 0,
              stddev_prior: 1,
            },
            { 
              arm_name: 'Treatment', 
              arm_description: 'New personalized version',
              mean_prior: 0,
              stddev_prior: 1,
            },
          ],
        } as CMABFormData;
        
      default:
        throw new Error(`Unsupported experiment type: ${experimentType}`);
    }
  };

  const handleExperimentTypeSelect = (type: ExperimentType, assignmentType?: AssignmentType) => {
    if (type === 'frequent_ab' && assignmentType) {
      setSelectedExperimentType(type);
      setSelectedAssignmentType(assignmentType);
      setShowTypeSelection(false);
    } else if (type === 'multi_armed_bandit') {
      setSelectedExperimentType(type);
      setSelectedAssignmentType('online');
      setShowTypeSelection(false);
    } else if (type === 'bayesian_ab') {
      setSelectedExperimentType(type);
      setSelectedAssignmentType('online');
      setShowTypeSelection(false);
    } else if (type === 'contextual_bandit') {
      setSelectedExperimentType(type);
      setSelectedAssignmentType('online');
      setShowTypeSelection(false);
    }
  };

  const handleContinue = () => {
    if (selectedExperimentType && (selectedAssignmentType || selectedExperimentType !== 'frequent_ab')) {
      setShowTypeSelection(false);
    }
  };

  const handleBackToTypeSelection = () => {
    setShowTypeSelection(true);
    setSelectedExperimentType(undefined);
    setSelectedAssignmentType(undefined);
  };

  const renderExperimentFlow = () => {
    if (!selectedExperimentType) return null;

    const initialFormData = createInitialFormData(selectedExperimentType, selectedAssignmentType);

    switch (selectedExperimentType) {
      case 'frequent_ab':
        return (
          <FrequentABContainer
            webhooks={webhooks}
            initialFormData={initialFormData as FrequentABFormData}
            onBack={handleBackToTypeSelection}
          />
        );

      case 'multi_armed_bandit':
        return (
          <MABContainer
            webhooks={webhooks}
            initialFormData={initialFormData as MABFormData}
            onBack={handleBackToTypeSelection}
          />
        );

      case 'bayesian_ab':
        return (
          <BayesianABContainer
            webhooks={webhooks}
            initialFormData={initialFormData as BayesianABFormData}
            onBack={handleBackToTypeSelection}
          />
        );

      case 'contextual_bandit':
        return (
          <CMABContainer
            webhooks={webhooks}
            initialFormData={initialFormData as CMABFormData}
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
            <Heading size="8" mb="2">Create Experiment</Heading>
            <p style={{ color: 'var(--gray-11)', fontSize: '16px', margin: 0 }}>
              Choose the type of experiment you want to create
            </p>
          </Box>
          
          <ExperimentTypeSelector
            selectedType={selectedExperimentType}
            selectedAssignmentType={selectedAssignmentType}
            onTypeSelect={handleExperimentTypeSelect}
          />
          
          <NavigationButtons
            onNext={selectedExperimentType && (selectedAssignmentType || selectedExperimentType !== 'frequent_ab') ? handleContinue : undefined}
            nextLabel="Continue"
            nextDisabled={!selectedExperimentType || (selectedExperimentType === 'frequent_ab' && !selectedAssignmentType)}
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