'use client';

import { CheckboxGroup, DropdownMenu, Button, Flex, Badge } from '@radix-ui/themes';
import { ExperimentImpactBadge } from '@/components/features/experiments/experiment-impact-badge';

const IMPACT_OPTIONS = ['high', 'medium', 'low', 'negative', 'unclear'] as const;
const NOT_SPECIFIED_FILTER = '__not_specified__';

interface ExperimentImpactFilterProps {
  value: string[];
  onChange: (selectedImpacts: string[]) => void;
}

export function ExperimentImpactFilter({ value, onChange }: ExperimentImpactFilterProps) {
  const handleValueChange = (values: string[]) => {
    onChange(values);
  };

  const displayLabel = value.length === 0 ? 'Impact' : `Impact (${value.length})`;

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
            {IMPACT_OPTIONS.map((impact) => (
              <CheckboxGroup.Item key={impact} value={impact}>
                <Flex gap="2" align="center">
                  <ExperimentImpactBadge impact={impact} />
                </Flex>
              </CheckboxGroup.Item>
            ))}
            <CheckboxGroup.Item key={NOT_SPECIFIED_FILTER} value={NOT_SPECIFIED_FILTER}>
              <Flex gap="2" align="center">
                <Badge color="gray" variant="soft">
                  Not specified
                </Badge>
              </Flex>
            </CheckboxGroup.Item>
          </Flex>
        </CheckboxGroup.Root>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
