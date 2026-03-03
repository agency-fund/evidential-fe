'use client';

import { useMemo } from 'react';
import { Button, Flex, Text } from '@radix-ui/themes';
import { GetStrataResponseElement } from '@/api/methods.schemas';
import { ClickableBadge } from './clickable-badge';
import { PlusIcon, TrashIcon } from '@radix-ui/react-icons';

interface StrataBuilderProps {
  availableStrata: GetStrataResponseElement[];
  selectedStrata: string[];
  onStrataChange: (selectedStrata: string[]) => void;
}

export function StrataBuilder({ availableStrata, selectedStrata, onStrataChange }: StrataBuilderProps) {
  const selectedSet = useMemo(() => new Set(selectedStrata), [selectedStrata]);
  const sortedStrata = useMemo(
    () => [...availableStrata].sort((a, b) => a.field_name.localeCompare(b.field_name)),
    [availableStrata],
  );

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
    <Flex direction="column" gap="3" overflowX="auto">
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
          color={selectedStrata.length === availableStrata.length ? 'gray' : 'green'}
        >
          <PlusIcon /> Add All
        </Button>
        <Button
          type="button"
          variant="soft"
          size="2"
          disabled={selectedStrata.length === 0}
          color={selectedStrata.length === 0 ? 'gray' : 'red'}
          onClick={handleClearAll}
        >
          <TrashIcon /> Clear All
        </Button>
      </Flex>

      <Flex direction="row" gap="2" wrap="wrap">
        {sortedStrata.map((stratum) => (
          <ClickableBadge
            key={stratum.field_name}
            input={stratum}
            color={selectedSet.has(stratum.field_name) ? undefined : 'gray'}
            onClick={(s) => handleStrataToggle(s.field_name, !selectedSet.has(s.field_name))}
            showPlus={false}
          />
        ))}
      </Flex>
    </Flex>
  );
}
