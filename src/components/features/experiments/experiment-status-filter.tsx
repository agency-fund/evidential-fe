'use client';

import { CheckboxGroup, DropdownMenu, Button, Flex } from '@radix-ui/themes';
import { ExperimentStatusBadge } from '@/components/features/experiments/experiment-status-badge';
import type { ExperimentStatus } from '@/components/features/experiments/types';

interface StatusOption {
  status: ExperimentStatus;
}

interface ExperimentStatusFilterProps {
  statusOptions: StatusOption[];
  value: ExperimentStatus[];
  onChange: (selectedStatuses: ExperimentStatus[]) => void;
}

export function ExperimentStatusFilter({ statusOptions, value, onChange }: ExperimentStatusFilterProps) {
  const handleValueChange = (values: string[]) => {
    onChange(values as ExperimentStatus[]);
  };

  const displayLabel =
    value.length === 0
      ? 'Status' : `Status (${value.length})`;

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
            {statusOptions.map((option) => (
              <CheckboxGroup.Item key={option.status} value={option.status}>
                <Flex gap="2" align="center">
                  <ExperimentStatusBadge status={option.status} />
                </Flex>
              </CheckboxGroup.Item>
            ))}
          </Flex>
        </CheckboxGroup.Root>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
