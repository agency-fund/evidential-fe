'use client';

import { Button, Flex, Text } from '@radix-ui/themes';
import { GetStrataResponseElement } from '@/api/methods.schemas';
import { ClickableBadge } from './clickable-badge';

interface StrataBuilderProps {
  availableStrata: GetStrataResponseElement[];
  selectedStrata: string[];
  onStrataChange: (selectedStrata: string[]) => void;
}

export function StrataBuilder({ availableStrata, selectedStrata, onStrataChange }: StrataBuilderProps) {
  const handleStrataToggle = (fieldName: string, checked: boolean) => {
    const newSelected = checked ? [...selectedStrata, fieldName] : selectedStrata.filter((s) => s !== fieldName);
    onStrataChange(newSelected);
  };

  const handleAddAll = () => {
    const allFieldNames = availableStrata.map((field) => field.field_name);
    onStrataChange(allFieldNames);
  };

  const handleClearAll = () => {
    onStrataChange([]);
  };

  return (
    <Flex direction="column" gap="3" overflowX={'auto'}>
      <Text size="2" color="gray">
        Select strata fields for balanced randomization of participants across experiment arms.
      </Text>
      <Flex gap="2" wrap="wrap">
        <Button
          type="button"
          variant="soft"
          size="2"
          onClick={handleAddAll}
          disabled={selectedStrata.length === availableStrata.length}
          {...(selectedStrata.length === availableStrata.length ? { color: 'gray' } : {})}
        >
          Add All
        </Button>
        <Button
          type="button"
          variant="soft"
          size="2"
          disabled={selectedStrata.length === 0}
          {...(selectedStrata.length === 0 ? { color: 'gray' } : {})}
          onClick={handleClearAll}
        >
          Clear All
        </Button>
      </Flex>

      <Flex direction="row" gap="2" wrap="wrap">
        {availableStrata
          .toSorted((a, b) => a.field_name.localeCompare(b.field_name))
          .map((stratum) => (
            <ClickableBadge
              key={stratum.field_name}
              input={stratum}
              {...(!selectedStrata.includes(stratum.field_name) ? { color: 'gray' } : {})}
              onClick={() => handleStrataToggle(stratum.field_name, !selectedStrata.includes(stratum.field_name))}
            ></ClickableBadge>
          ))}
      </Flex>
    </Flex>
  );
}
