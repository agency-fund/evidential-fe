'use client';
import React, { useEffect, useState } from 'react';
import { Box, Card, Flex, Text, Badge, Dialog, Button, Grid } from '@radix-ui/themes';
import { ExperimentType, AssignmentType } from '@/app/datasources/[datasourceId]/experiments/create/types';

interface ExperimentTypeOption {
  type: ExperimentType;
  title: string;
  badge: string;
  badgeColor: 'blue' | 'green' | 'purple' | 'orange';
  description: string;
  comingSoon: boolean;
}

const EXPERIMENT_TYPE_OPTIONS: ExperimentTypeOption[] = [
  {
    type: 'freq_online',
    title: 'Traditional A/B Testing',
    badge: 'A/B',
    badgeColor: 'blue',
    description:
      'Fixed allocation hypothesis testing with statistical significance. Best for clear hypotheses with sufficient traffic.',
    comingSoon: false,
  },
  {
    type: 'mab_online',
    title: 'Multi-Armed Bandit',
    badge: 'MAB',
    badgeColor: 'green',
    description:
      'Adaptive allocation that learns and optimizes automatically. Minimizes opportunity cost by converging to the best performing variant.',
    comingSoon: false,
  },
  {
    type: 'bayes_ab_online',
    title: 'Bayesian A/B Testing',
    badge: 'BAB',
    badgeColor: 'purple',
    description:
      'Bayesian statistics with credible intervals and probability statements. More intuitive interpretation of results.',
    comingSoon: true,
  },
  {
    type: 'cmab_online',
    title: 'Contextual Bandit',
    badge: 'CMAB',
    badgeColor: 'orange',
    description:
      'Context-aware optimization for personalized experiences. Adapts recommendations based on user or environmental context.',
    comingSoon: true,
  },
];

interface AssignmentOption {
  type: AssignmentType;
  title: string;
  description: string;
  badge: string;
  recommended?: boolean;
}

const ASSIGNMENT_OPTIONS: AssignmentOption[] = [
  {
    type: 'preassigned',
    title: 'Preassigned',
    description:
      'Participants are assigned to experiment arms at design time. Suitable for controlled experiments with fixed sample sizes.',
    badge: 'Recommended',
    recommended: true,
  },
  {
    type: 'online',
    title: 'Online Assignment',
    description:
      'Participants are assigned to experiment arms dynamically as they arrive. Better for real-time experiments with unknown traffic.',
    badge: 'Advanced',
  },
];

interface ExperimentTypeSelectorProps {
  selectedType?: ExperimentType;
  ds_driver: string;
  onTypeSelect: (type: ExperimentType) => void;
}

export function ExperimentTypeSelector({ selectedType, ds_driver, onTypeSelect }: ExperimentTypeSelectorProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [tempSelectedAssignment, setTempSelectedAssignment] = useState<AssignmentType>();

  const handleTypeSelect = (type: ExperimentType) => {
    if (type.includes('freq')) {
      setShowAssignmentDialog(true);
    } else if (!EXPERIMENT_TYPE_OPTIONS.find((opt) => opt.type === type)?.comingSoon) {
      onTypeSelect(type);
    }
  };

  const handleAssignmentConfirm = () => {
    if (tempSelectedAssignment) {
      if (tempSelectedAssignment === 'preassigned') {
        onTypeSelect('freq_preassigned');
      } else {
        onTypeSelect('freq_online');
      }
      setShowAssignmentDialog(false);
      setTempSelectedAssignment(undefined);
    }
  };

  return (
    <Box>
      <Grid columns="2" gap="4">
        {EXPERIMENT_TYPE_OPTIONS.map((option) => (
          <ExperimentTypeCard
            key={option.type}
            option={option}
            isSelected={selectedType === option.type}
            isDisabled={(option.type.includes('freq') && ds_driver === 'none') || option.comingSoon}
            onSelect={() => handleTypeSelect(option.type)}
          />
        ))}
      </Grid>

      {/* Assignment Type Dialog for Traditional A/B */}
      <Dialog.Root open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <Dialog.Content style={{ maxWidth: '600px' }}>
          <Dialog.Title>Choose Assignment Method</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            Select how participants will be assigned to experiment arms for your A/B Test.
          </Dialog.Description>

          <Flex direction="column" gap="3" mb="6">
            {ASSIGNMENT_OPTIONS.map((option) => (
              <Card
                key={option.type}
                style={
                  tempSelectedAssignment === option.type
                    ? { border: '2px solid var(--accent-9)', backgroundColor: 'var(--accent-2)' }
                    : {}
                }
                onClick={() => setTempSelectedAssignment(option.type)}
              >
                <Flex direction="column" gap="2">
                  <Flex align="center" gap="2">
                    <Text size="3" weight="bold">
                      {option.title}
                    </Text>
                    {option.recommended && (
                      <Badge color="green" size="1">
                        {option.badge}
                      </Badge>
                    )}
                    {!option.recommended && (
                      <Badge color="gray" size="1">
                        {option.badge}
                      </Badge>
                    )}
                  </Flex>

                  <Text size="2" color="gray">
                    {option.description}
                  </Text>
                </Flex>
              </Card>
            ))}
          </Flex>

          <Flex gap="3" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button onClick={handleAssignmentConfirm} disabled={!tempSelectedAssignment}>
              Continue
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}

interface ExperimentTypeCardProps {
  option: ExperimentTypeOption;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}

function ExperimentTypeCard({ option, isSelected, isDisabled, onSelect }: ExperimentTypeCardProps) {
  return (
    <Card onClick={isDisabled ? undefined : onSelect}>
      <Box style={{ borderColor: isSelected ? 'var(--accent-9)' : 'var(--gray-6)' }}>
        <Flex align="center" gap="2">
          <Text size="4" weight={isDisabled ? 'regular' : 'bold'}>
            {option.title}
          </Text>
          <Badge color={option.badgeColor} size="1">
            {option.badge}
          </Badge>
        </Flex>
        {option.comingSoon && (
          <Badge color="gray" size="1" mt="20px">
            Coming Soon
          </Badge>
        )}
        <Flex direction="column" gap="1">
          <Text size="2" weight={isDisabled ? 'light' : 'regular'} mt="20px">
            {option.description}
          </Text>
        </Flex>
      </Box>
    </Card>
  );
}
