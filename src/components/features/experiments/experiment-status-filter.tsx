'use client';

import { CheckboxGroup, DropdownMenu, Button, Flex } from '@radix-ui/themes';
import { ExperimentStatusBadge } from '@/components/features/experiments/experiment-status-badge';
import type { ExperimentStatus } from '@/components/features/experiments/types';

const STATUS_OPTIONS: ExperimentStatus[] = ['current', 'upcoming', 'finished'];

interface ExperimentStatusFilterProps {
  value: ExperimentStatus[];
  onChange: (selectedStatuses: ExperimentStatus[]) => void;
}

export function ExperimentStatusFilter({ value, onChange }: ExperimentStatusFilterProps) {
  const handleValueChange = (values: string[]) => {
    onChange(values as ExperimentStatus[]);
  };

  const displayLabel = value.length === 0 ? 'Status' : `Status (${value.length})`;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="outline">
          {displayLabel}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <CheckboxGroup.Root value={value} onValueChange={handleValueChange}>
          <Flex direction="column" gap="3" px="1" py="2">
            {STATUS_OPTIONS.map((status) => (
              <CheckboxGroup.Item key={status} value={status}>
                <Flex gap="2" align="center">
                  <ExperimentStatusBadge status={status} />
                </Flex>
              </CheckboxGroup.Item>
            ))}
          </Flex>
        </CheckboxGroup.Root>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
