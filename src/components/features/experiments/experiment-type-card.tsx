'use client';
import React from 'react';
import { Box, Card, Flex, Text, Badge } from '@radix-ui/themes';
import { ExperimentType } from '@/app/datasources/[datasourceId]/experiments/create/types';

export interface ExperimentTypeOption {
  type: ExperimentType;
  title: string;
  badge: string;
  badgeColor: 'blue' | 'green' | 'purple' | 'orange';
  description: string;
}

interface ExperimentTypeCardProps {
  option: ExperimentTypeOption;
  isSelected: boolean;
  isDisabled: boolean;
  onSelect: () => void;
}

export function ExperimentTypeCard({ option, isSelected, isDisabled, onSelect }: ExperimentTypeCardProps) {
  return (
    <Card
      onClick={isDisabled ? undefined : onSelect}
      style={{ cursor: isDisabled ? 'var(--cursor-disabled)' : 'var(--cursor-link)' }}
    >
      <Box style={{ borderColor: isSelected ? 'var(--accent-9)' : 'var(--gray-6)' }}>
        <Flex align="center" gap="2">
          <Text size="4" weight={isDisabled ? 'regular' : 'bold'}>
            {option.title}
          </Text>
          <Badge color={option.badgeColor} size="1">
            {option.badge}
          </Badge>
        </Flex>
        <Flex direction="column" gap="1">
          <Text size="2" weight={isDisabled ? 'light' : 'regular'} mt="20px">
            {option.description}
          </Text>
        </Flex>
      </Box>
    </Card>
  );
}
