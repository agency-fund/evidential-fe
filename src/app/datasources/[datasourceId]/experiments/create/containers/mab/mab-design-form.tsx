'use client';
import React from 'react';
import { Box, Card, Flex, Text, Callout, Separator } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { MABFormData, PriorType, OutcomeType } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';

interface MABDesignFormProps {
  formData: MABFormData;
  onFormDataChange: (data: MABFormData) => void;
  onNext: () => void;
  onBack: () => void;
}

interface OutcomeOption {
  type: OutcomeType;
  title: string;
  description: string;
}

const OUTCOME_OPTIONS: OutcomeOption[] = [
  {
    type: 'binary',
    title: 'Binary',
    description:
      'Yes/No outcomes: conversions, clicks, sign-ups, purchases. Results are expressed as percentages or rates.',
  },
  {
    type: 'real-valued',
    title: 'Real-valued',
    description:
      'Continuous numeric outcomes: revenue per user, time spent, satisfaction scores, any measurable quantity.',
  },
];

export function MABDesignForm({ formData, onFormDataChange, onNext, onBack }: MABDesignFormProps) {
  const handleOutcomeChange = (outcomeType: OutcomeType) => {
    // Auto-map prior type based on outcome type for MAB
    const priorType: PriorType = outcomeType === 'binary' ? 'beta' : 'normal';

    // Update existing arms to have the correct prior parameters
    const updatedArms = formData.arms.map((arm) => {
      const baseArm = {
        arm_name: arm.arm_name,
        arm_description: arm.arm_description,
      };

      if (priorType === 'beta') {
        // Convert to beta parameters (or use defaults)
        return {
          ...baseArm,
          alpha_prior: arm.alpha_prior || 1,
          beta_prior: arm.beta_prior || 1,
          // Remove normal parameters
          mean_prior: undefined,
          stddev_prior: undefined,
        };
      } else {
        // Convert to normal parameters (or use defaults)
        return {
          ...baseArm,
          mean_prior: arm.mean_prior ?? 0,
          stddev_prior: arm.stddev_prior || 1,
          // Remove beta parameters
          alpha_prior: undefined,
          beta_prior: undefined,
        };
      }
    });

    const updatedData = {
      ...formData,
      outcomeType,
      priorType, // Automatically set based on outcome
      arms: updatedArms, // Update arms with correct parameters
    };
    onFormDataChange(updatedData);
  };

  const isNextDisabled = !formData.outcomeType;

  return (
    <Flex direction="column" gap="6">
      {/* Outcome Type Section */}
      <SectionCard title="Outcome Type">
        <Text size="2" color="gray" mb="20px">
          Define the type of outcome measured in this experiment. The prior distribution will be automatically selected
          based on your choice.
        </Text>
        <Text size="2" weight="medium" mb="12px" mt="12px" as="div">
          Select outcome type
        </Text>

        <Flex direction="column" gap="3">
          {OUTCOME_OPTIONS.map((option) => (
            <OutcomeOptionCard
              key={option.type}
              option={option}
              isSelected={formData.outcomeType === option.type}
              onSelect={() => handleOutcomeChange(option.type)}
            />
          ))}
        </Flex>

        {/* Show selected prior distribution */}
        {formData.outcomeType && (
          <Flex direction="column" gap="2">
            <Box p="4" mt="4" as="div">
              <Text size="2" weight="bold" color="blue">
                ✓ Selected Configuration: {formData.outcomeType === 'binary' ? 'Beta' : 'Normal'} Prior ×{' '}
                {formData.outcomeType === 'binary' ? 'Binary' : 'Real-valued'} Outcome
              </Text>
              <Text ml="16px" size="1" color="blue" mt="1" as="div">
                {formData.outcomeType === 'binary'
                  ? 'Using Alpha (prior successes) and Beta (prior failures) parameters'
                  : 'Using Mean and Standard Deviation parameters'}
              </Text>
            </Box>
          </Flex>
        )}
      </SectionCard>

      {/* Info Note */}
      <Callout.Root mt="20px">
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Multi-Armed Bandit experiments do not require power analysis or sample size planning. The algorithm
          automatically adapts allocation based on performance.
        </Callout.Text>
      </Callout.Root>

      <NavigationButtons onBack={onBack} onNext={onNext} nextLabel="Next" nextDisabled={isNextDisabled} />
    </Flex>
  );
}

interface OutcomeOptionCardProps {
  option: OutcomeOption;
  isSelected: boolean;
  onSelect: () => void;
}

function OutcomeOptionCard({ option, isSelected, onSelect }: OutcomeOptionCardProps) {
  return (
    <Card
      size="2"
      onClick={onSelect}
      asChild
      style={isSelected ? { border: '2px solid var(--accent-9)', backgroundColor: 'var(--accent-2)' } : {}}
    >
      <Box as="div">
        <Flex direction="column" gap="1">
          <Text size="3" weight="bold">
            {option.title}
          </Text>
          <Text size="2" color="gray">
            {option.description}
          </Text>
        </Flex>
      </Box>
    </Card>
  );
}
