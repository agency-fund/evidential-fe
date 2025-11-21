'use client';

import { CheckboxGroup, DropdownMenu, Button, Flex } from '@radix-ui/themes';
import { ExperimentStatusBadge, type ExperimentStatus } from './experiment-status-badge';

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
    const statuses = values as ExperimentStatus[];
    onChange(statuses);
  };

  const displayLabel =
    value.length === 0
      ? 'Status'
      : value.length === 1
        ? value[0].charAt(0).toUpperCase() + value[0].slice(1)
        : `Status (${value.length})`;

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
