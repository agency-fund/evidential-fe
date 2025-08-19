'use client';
import React, { useState } from 'react';
import { Box, RadioCards, Flex, Text, Badge, Dialog, Button, Grid } from '@radix-ui/themes';
import {
  ExperimentType,
  AssignmentType,
  isFreqExperimentType,
} from '@/app/datasources/[datasourceId]/experiments/create/types';
import { ExperimentTypeOption, ExperimentTypeCard } from '@/components/features/experiments/experiment-type-card';

const EXPERIMENT_TYPE_OPTIONS: ExperimentTypeOption[] = [
  {
    type: 'freq_online',
    title: 'Traditional A/B Testing',
    badge: 'A/B',
    badgeColor: 'blue',
    description:
      'Fixed allocation hypothesis testing with statistical significance. Best for clear hypotheses with sufficient traffic.',
  },
  {
    type: 'mab_online',
    title: 'Multi-Armed Bandit',
    badge: 'MAB',
    badgeColor: 'green',
    description:
      'Adaptive allocation that learns and optimizes automatically. Minimizes opportunity cost by converging to the best performing variant.',
  },
  {
    type: 'cmab_online',
    title: 'Contextual Multi-Armed Bandit',
    badge: 'CMAB',
    badgeColor: 'purple',
    description:
      'Context-aware optimization for personalized experiences. Adapts recommendations based on user or environmental context.',
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
  dsDriver: string;
  onTypeSelect: (type: ExperimentType) => void;
}

export function ExperimentTypeSelector({ selectedType, dsDriver, onTypeSelect }: ExperimentTypeSelectorProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [tempSelectedAssignment, setTempSelectedAssignment] = useState<AssignmentType>();

  const handleTypeSelect = (type: ExperimentType) => {
    if (isFreqExperimentType(type)) {
      setShowAssignmentDialog(true);
    } else {
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
    <Flex direction="column" gap="4">
      <Grid columns="2" gap="4">
        {EXPERIMENT_TYPE_OPTIONS.map((option) => (
          <ExperimentTypeCard
            key={option.type}
            option={option}
            isSelected={selectedType === option.type}
            isDisabled={(isFreqExperimentType(option.type) && dsDriver === 'api_only') || false}
            onSelect={() => handleTypeSelect(option.type)}
          />
        ))}
      </Grid>

      {/* Assignment Type Dialog for Traditional A/B */}
      <Flex direction="column" gap="3">
        <Dialog.Root open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
          <Dialog.Content style={{ maxWidth: '600px' }}>
            <Dialog.Title>Choose Assignment Method</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Select how participants will be assigned to experiment arms for your A/B Test.
            </Dialog.Description>

            <Box maxWidth={'600px'}>
              <Flex direction="column" gap="4">
                <RadioCards.Root
                  defaultValue={tempSelectedAssignment}
                  onValueChange={(value) => setTempSelectedAssignment(value as AssignmentType)}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  {ASSIGNMENT_OPTIONS.map((option) => (
                    <RadioCards.Item key={option.type} value={option.type}>
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
                    </RadioCards.Item>
                  ))}
                </RadioCards.Root>
              </Flex>
            </Box>

            <Flex gap="3" justify="end" mt="4">
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
      </Flex>
    </Flex>
  );
}
