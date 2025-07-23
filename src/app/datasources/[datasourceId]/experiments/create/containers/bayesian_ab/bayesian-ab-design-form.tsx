'use client';
import React from 'react';
import { Box, Card, Flex, Text, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { BayesianABFormData, OutcomeType } from '@/app/datasources/[datasourceId]/experiments/create/types';
import { NavigationButtons } from '@/components/features/experiments/navigation-buttons';
import { SectionCard } from '@/components/ui/cards/section-card';

interface BayesianABDesignFormProps {
  formData: BayesianABFormData;
  onFormDataChange: (data: BayesianABFormData) => void;
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
    description: 'Yes/No outcomes: conversions, clicks, sign-ups, purchases. Results are expressed as percentages or rates.',
  },
  {
    type: 'real_valued',
    title: 'Real-valued',
    description: 'Continuous numeric outcomes: revenue per user, time spent, satisfaction scores, any measurable quantity.',
  },
];

export function BayesianABDesignForm({ 
  formData, 
  onFormDataChange, 
  onNext, 
  onBack 
}: BayesianABDesignFormProps) {

  const handleOutcomeChange = (outcomeType: OutcomeType) => {
    // For Bayesian A/B, always use normal distribution
    const updatedArms = formData.arms.map(arm => {
      const baseArm = {
        arm_name: arm.arm_name,
        arm_description: arm.arm_description,
      };
      
      // Always use normal parameters for Bayesian A/B
      return {
        ...baseArm,
        mean_prior: arm.mean_prior ?? 0,
        stddev_prior: arm.stddev_prior || 1,
        // Remove beta parameters  
        alpha_prior: undefined,
        beta_prior: undefined,
      };
    });
    
    const updatedData = { 
      ...formData, 
      outcomeType,
      priorType: 'normal', // Always normal for Bayesian A/B
      arms: updatedArms,
    };
    onFormDataChange(updatedData);
  };

  const isNextDisabled = !formData.outcomeType;

  return (
    <Flex direction="column" gap="6">
      <SectionCard title="Outcome Type">
        <Text size="2" color="gray" style={{ marginBottom: '20px' }}>
          Define the type of outcome you&apos;ll be measuring in this experiment. Bayesian A/B testing uses Normal distribution for both outcome types.
        </Text>
        
        <Text size="2" weight="medium" style={{ marginBottom: '12px' }}>
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

        {/* Show selected configuration */}
        {formData.outcomeType && (
          <Box style={{ 
            background: 'var(--accent-2)', 
            border: '1px solid var(--accent-6)', 
            borderRadius: '6px', 
            padding: '12px',
            marginTop: '16px'
          }}>
            <Text size="2" weight="medium" style={{ color: 'var(--accent-11)' }}>
              ✓ Selected Configuration: Normal Distribution × {formData.outcomeType === 'binary' ? 'Binary' : 'Real-valued'} Outcome
            </Text>
            <Text size="1" color="gray" style={{ marginTop: '4px', display: 'block' }}>
              Using Mean and Standard Deviation parameters for Bayesian inference
            </Text>
          </Box>
        )}
      </SectionCard>

      {/* Info Note */}
      <Callout.Root style={{ marginTop: '20px' }}>
        <Callout.Icon>
          <InfoCircledIcon />
        </Callout.Icon>
        <Callout.Text>
          Bayesian A/B experiments don't require power analysis or fixed sample sizes. 
          Results update continuously with credible intervals and probability statements.
        </Callout.Text>
      </Callout.Root>

      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        nextLabel="Continue to Metadata"
        nextDisabled={isNextDisabled}
      />
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
      style={{
        cursor: 'pointer',
        border: isSelected ? '2px solid var(--accent-9)' : '1px solid var(--gray-6)',
        backgroundColor: isSelected ? 'var(--accent-2)' : 'white',
        padding: '16px',
        transition: 'all 0.2s ease',
      }}
      onClick={onSelect}
    >
      <Flex align="start" gap="3">
        {/* Radio button indicator */}
        <Box
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: `2px solid ${isSelected ? 'var(--accent-9)' : 'var(--gray-6)'}`,
            backgroundColor: isSelected ? 'var(--accent-9)' : 'white',
            marginTop: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSelected && (
            <Box
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'white',
              }}
            />
          )}
        </Box>

        <Flex direction="column" gap="1" style={{ flex: 1 }}>
          <Text size="3" weight="bold">{option.title}</Text>
          <Text size="2" color="gray" style={{ lineHeight: 1.4 }}>
            {option.description}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}