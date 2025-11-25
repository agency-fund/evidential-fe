'use client';

import { CheckboxGroup, DropdownMenu, Button, Flex } from '@radix-ui/themes';
import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';
import type { ExperimentImpact } from '@/components/features/experiments/types';

interface ImpactOption {
  impact: ExperimentImpact ;
}

interface ExperimentImpactFilterProps {
  impactOptions: ImpactOption[];
  value: ExperimentImpact[];
  onChange: (selectedImpacts: ExperimentImpact[]) => void;
}

export function ExperimentImpactFilter({ impactOptions, value, onChange }: ExperimentImpactFilterProps) {
  const handleValueChange = (values: string[]) => {
  onChange(values as ExperimentImpact[]);
};
  const displayLabel =
    value.length === 0
      ? 'Impact' : `Impact (${value.length})`;

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
            {impactOptions.map((option) => (
              <CheckboxGroup.Item key={option.impact} value={option.impact}>
                <Flex gap="2" align="center">
                  <ExperimentImpactBadge impact={option.impact} />
                </Flex>
              </CheckboxGroup.Item>
            ))}
          </Flex>
        </CheckboxGroup.Root>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
