'use client';
import React from 'react';
import { Flex, Text, Box } from '@radix-ui/themes';
import { ExperimentType, EXPERIMENT_STEP_FLOWS } from '@/app/datasources/[datasourceId]/experiments/create/types';

interface BreadcrumbStep {
  id: string;
  label: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
}

interface AdaptiveBreadcrumbsProps {
  experimentType?: ExperimentType;
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

const STEP_LABELS = {
  type: 'Experiment Type',
  design: 'Experiment Design',
  metadata: 'Experiment Metadata',
  summary: 'Experiment Summary',
} as const;

export function AdaptiveBreadcrumbs({ experimentType, currentStep, onStepClick }: AdaptiveBreadcrumbsProps) {
  if (!experimentType) {
    return null;
  }

  const stepFlow = EXPERIMENT_STEP_FLOWS[experimentType];
  const steps: BreadcrumbStep[] = stepFlow.map((stepId, index) => ({
    id: stepId,
    label: STEP_LABELS[stepId],
    isCompleted: index < currentStep - 1,
    isCurrent: index === currentStep - 1,
    isAccessible: index <= currentStep - 1,
  }));

  return (
    <Box
      mb="24px"
      px="16px"
      py="20px"
      style={{
        backgroundColor: 'var(--gray-2)',
        border: '1px solid var(--gray-6)',
        borderRadius: '8px',
      }}
    >
      <Flex align="center" gap="2" wrap="wrap">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <BreadcrumbItem step={step} onClick={onStepClick ? () => onStepClick(index + 1) : undefined} />
            {index < steps.length - 1 && (
              <Text size="2" color="gray" mx="2">
                →
              </Text>
            )}
          </React.Fragment>
        ))}
      </Flex>
    </Box>
  );
}

interface BreadcrumbItemProps {
  step: BreadcrumbStep;
  onClick?: () => void;
}

function BreadcrumbItem({ step, onClick }: BreadcrumbItemProps) {
  const isClickable = onClick && step.isAccessible;

  return (
    <Box
      style={{
        padding: '4px 8px',
        borderRadius: '4px',
        cursor: isClickable ? 'pointer' : 'default',
        backgroundColor: step.isCurrent ? 'var(--accent-3)' : 'transparent',
        transition: 'background-color 0.2s ease',
        ...(isClickable && {
          ':hover': {
            backgroundColor: 'var(--gray-3)',
          },
        }),
      }}
      onClick={isClickable ? onClick : undefined}
    >
      <Text
        size="2"
        weight={step.isCurrent ? 'bold' : 'medium'}
        color={step.isCurrent ? 'gray' : step.isCompleted ? 'gray' : step.isAccessible ? 'blue' : 'gray'}
      >
        {step.label}
      </Text>
    </Box>
  );
}
