'use client';
import React, { useState } from 'react';
import { Box, Card, Flex, Text, Badge, Dialog, Button } from '@radix-ui/themes';
import { ExperimentType, AssignmentType } from '@/app/datasources/[datasourceId]/experiments/create/types';

interface ExperimentTypeOption {
  type: ExperimentType;
  title: string;
  badge: string;
  badgeColor: 'blue' | 'green' | 'purple' | 'orange';
  description: string;
  comingSoon?: boolean;
}

const EXPERIMENT_TYPE_OPTIONS: ExperimentTypeOption[] = [
  {
    type: 'freq_online',
    title: 'Frequent A/B Testing',
    badge: 'A/B',
    badgeColor: 'blue',
    description: 'Fixed allocation hypothesis testing with statistical significance. Best for clear hypotheses with sufficient traffic.',
  },
  {
    type: 'mab_online',
    title: 'Multi-Armed Bandit',
    badge: 'MAB',
    badgeColor: 'green',
    description: 'Adaptive allocation that learns and optimizes automatically. Minimizes opportunity cost by converging to the best performing variant.',
    // comingSoon: true,
  },
  {
    type: 'bayes_ab_online',
    title: 'Bayesian A/B Testing',
    badge: 'BAB',
    badgeColor: 'purple',
    description: 'Bayesian statistics with credible intervals and probability statements. More intuitive interpretation of results.',
    comingSoon: true,
  },
  {
    type: 'cmab_online',
    title: 'Contextual Bandit',
    badge: 'CMAB',
    badgeColor: 'orange',
    description: 'Context-aware optimization for personalized experiences. Adapts recommendations based on user or environmental context.',
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
    description: 'Participants are assigned to experiment arms at design time. Suitable for controlled experiments with fixed sample sizes.',
    badge: 'Recommended',
    recommended: true,
  },
  {
    type: 'online',
    title: 'Online Assignment',
    description: 'Participants are assigned to experiment arms dynamically as they arrive. Better for real-time experiments with unknown traffic.',
    badge: 'Advanced',
  },
];

interface ExperimentTypeSelectorProps {
  selectedType?: ExperimentType;
  onTypeSelect: (type: ExperimentType) => void;
}

export function ExperimentTypeSelector({
  selectedType,
  onTypeSelect
}: ExperimentTypeSelectorProps) {
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [tempSelectedAssignment, setTempSelectedAssignment] = useState<AssignmentType>();

  const handleTypeSelect = (type: ExperimentType) => {
    if (type.includes('freq')) {
      setShowAssignmentDialog(true);
    } else if (!EXPERIMENT_TYPE_OPTIONS.find(opt => opt.type === type)?.comingSoon) {
      onTypeSelect(type);
    }
  };

  const handleAssignmentConfirm = () => {
    if (tempSelectedAssignment) {
      if (tempSelectedAssignment === "preassigned") {
        onTypeSelect('freq_preassigned')
      } else {
        onTypeSelect('freq_online')
      }
      setShowAssignmentDialog(false);
      setTempSelectedAssignment(undefined);
    }
  };

  return (
    <Box>
      <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {EXPERIMENT_TYPE_OPTIONS.map((option) => (
          <ExperimentTypeCard
            key={option.type}
            option={option}
            isSelected={selectedType === option.type}
            onSelect={() => handleTypeSelect(option.type)}
          />
        ))}
      </Box>

      {/* Assignment Type Dialog for Frequent A/B */}
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
                style={{
                  cursor: 'pointer',
                  border: tempSelectedAssignment === option.type ? '2px solid var(--accent-9)' : '1px solid var(--gray-6)',
                  backgroundColor: tempSelectedAssignment === option.type ? 'var(--accent-2)' : 'white',
                  padding: '16px',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setTempSelectedAssignment(option.type)}
              >
                <Flex align="start" gap="3">
                  <Box
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${tempSelectedAssignment === option.type ? 'var(--accent-9)' : 'var(--gray-6)'}`,
                      backgroundColor: tempSelectedAssignment === option.type ? 'var(--accent-9)' : 'white',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {tempSelectedAssignment === option.type && (
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

                  <Flex direction="column" gap="2" style={{ flex: 1 }}>
                    <Flex align="center" gap="2">
                      <Text size="3" weight="bold">{option.title}</Text>
                      {option.recommended && (
                        <Badge color="green" size="1">{option.badge}</Badge>
                      )}
                      {!option.recommended && (
                        <Badge color="gray" size="1">{option.badge}</Badge>
                      )}
                    </Flex>

                    <Text size="2" color="gray" style={{ lineHeight: 1.4 }}>
                      {option.description}
                    </Text>
                  </Flex>
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
            <Button
              onClick={handleAssignmentConfirm}
              disabled={!tempSelectedAssignment}
            >
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
  onSelect: () => void;
}

function ExperimentTypeCard({ option, isSelected, onSelect }: ExperimentTypeCardProps) {
  return (
    <Card
      style={{
        cursor: option.comingSoon ? 'not-allowed' : 'pointer',
        opacity: option.comingSoon ? 0.6 : 1,
        border: isSelected ? '2px solid var(--accent-9)' : '2px solid var(--gray-6)',
        backgroundColor: isSelected ? 'var(--accent-2)' : 'white',
        position: 'relative',
        padding: '24px',
        transition: 'all 0.2s ease',
      }}
      onClick={onSelect}
    >
      <Flex direction="column" gap="3">
        <Flex align="center" gap="3">
          {/* Radio button indicator */}
          <Box
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: `2px solid ${isSelected ? 'var(--accent-9)' : 'var(--gray-6)'}`,
              backgroundColor: isSelected ? 'var(--accent-9)' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isSelected && (
              <Text size="1" style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>
            )}
          </Box>

          <Flex direction="column" gap="1" style={{ flex: 1 }}>
            <Flex align="center" gap="2">
              <Text size="4" weight="bold">{option.title}</Text>
              <Badge color={option.badgeColor} size="1">{option.badge}</Badge>
            </Flex>
            {option.comingSoon && (
              <Badge color="gray" size="1" style={{ alignSelf: 'flex-start' }}>Coming Soon</Badge>
            )}
          </Flex>
        </Flex>

        <Text size="2" color="gray" style={{ lineHeight: 1.5, marginLeft: '32px' }}>
          {option.description}
        </Text>
      </Flex>
    </Card>
  );
}
