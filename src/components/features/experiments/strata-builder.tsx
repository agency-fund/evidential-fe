'use client';

import { Badge, Button, Flex, Text } from '@radix-ui/themes';
import { GetStrataResponseElement } from '@/api/methods.schemas';

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
    <Flex direction="column" gap="3">
      <Text size="2" color="gray">
        Select fields to use for stratified randomization to ensure participant distributions are balanced with respect
        to these dimensions across the arms.
      </Text>

      <Flex gap="2" wrap="wrap">
        <Button
          type="button"
          variant="soft"
          size="1"
          onClick={handleAddAll}
          disabled={selectedStrata.length === availableStrata.length}
        >
          Add All
        </Button>
        {selectedStrata.length > 0 && (
          <Button type="button" variant="soft" size="1" color="gray" onClick={handleClearAll}>
            Clear All
          </Button>
        )}
      </Flex>

      <Flex direction="column" gap="2">
        {availableStrata.map((stratum) => (
          <Button
            key={stratum.field_name}
            type="button"
            variant={selectedStrata.includes(stratum.field_name) ? 'solid' : 'soft'}
            color={selectedStrata.includes(stratum.field_name) ? 'blue' : 'gray'}
            size="1"
            onClick={() => handleStrataToggle(stratum.field_name, !selectedStrata.includes(stratum.field_name))}
            style={{ justifyContent: 'flex-start' }}
          >
            <Flex align="center" gap="2" width="100%">
              <Text size="1" weight="medium">
                {stratum.field_name}
              </Text>
              <Badge variant="soft" size="1" color="gray">
                {stratum.data_type}
              </Badge>
            </Flex>
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
