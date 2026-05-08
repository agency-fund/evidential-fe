'use client';

import { useState } from 'react';
import { Box, Flex, IconButton, Table, Text } from '@radix-ui/themes';
import { FieldMetadata } from '@/api/methods.schemas';
import { Combobox } from '@/components/ui/combobox';
import { DataTypeBadge } from '@/components/ui/data-type-badge';
import FieldDataCard from '@/components/ui/cards/field-data-card';
import { TrashIcon } from '@radix-ui/react-icons';

const MAX_STRATA_COUNT = 10;

interface StrataBuilderProps {
  /** All strata candidates, excluding invalid fields (e.g. primary key). Caller should sort. */
  availableStrata: FieldMetadata[];
  selectedStrata: FieldMetadata[];
  onStrataChange: (selectedStrata: FieldMetadata[]) => void;
}

const getSearchTextFromOption = (option: FieldMetadata) => option.field_name;

interface StrataComboboxRowProps {
  stratum: FieldMetadata;
}

const StrataComboboxRow = ({ stratum }: StrataComboboxRowProps) => {
  return (
    <Flex gap="2" align="center" justify="between" wrap="nowrap">
      <Text size="2">{stratum.field_name}</Text>
      <DataTypeBadge type={stratum.data_type} />
    </Flex>
  );
};

export function StrataBuilder({ availableStrata, selectedStrata, onStrataChange }: StrataBuilderProps) {
  const [searchText, setSearchText] = useState('');
  const hasReachedStrataLimit = selectedStrata.length >= MAX_STRATA_COUNT;
  const comboboxOptions = availableStrata.filter(
    (stratum) => !selectedStrata.some((s) => s.field_name === stratum.field_name),
  );

  const handleStrataAdd = (value: string, fieldName?: string) => {
    setSearchText(value);
    // Prevent adding beyond the limit and adding unavailable fields.
    if (!fieldName || hasReachedStrataLimit) return;
    const toAdd = comboboxOptions.find((f) => f.field_name === fieldName);
    if (!toAdd) return;

    onStrataChange([...selectedStrata, toAdd]);
    setSearchText('');
  };

  const handleStrataRemove = (fieldName: string) => {
    onStrataChange(selectedStrata.filter((stratum) => stratum.field_name !== fieldName));
  };

  return availableStrata.length === 0 ? (
    <Text color="gray" size="2">
      No strata available for this participant type.
    </Text>
  ) : (
    <Flex direction="column" gap="3" overflowX="auto">
      <Text size="2" color="gray">
        Select strata fields for balanced randomization of participants across experiment arms.
      </Text>
      <Flex direction="column" gap="2">
        <Flex gap="2" align="center">
          <Text as="label" size="2" weight="bold">
            Add strata:
          </Text>
          <Combobox<FieldMetadata>
            value={searchText}
            onChange={handleStrataAdd}
            options={comboboxOptions}
            getDisplayTextForOption={getSearchTextFromOption}
            getKeyForOption={getSearchTextFromOption}
            placeholder="Search fields..."
            noMatchText="No available strata"
            dropdownRow={({ option }) => <StrataComboboxRow stratum={option} />}
            disabled={comboboxOptions.length === 0 || hasReachedStrataLimit}
          />
          {hasReachedStrataLimit && (
            <Text color="red" size="2">
              You may specify no more than {MAX_STRATA_COUNT} strata in the experiment.
            </Text>
          )}
        </Flex>
      </Flex>

      {selectedStrata.length > 0 && (
        <Box width="50%">
          <Table.Root layout="fixed">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Stratum</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {selectedStrata.map((stratum) => (
                <Table.Row key={stratum.field_name}>
                  <Table.Cell>
                    <Flex gap="2" align="center">
                      <IconButton
                        variant="soft"
                        color="red"
                        onClick={(event) => {
                          event.preventDefault();
                          handleStrataRemove(stratum.field_name);
                        }}
                      >
                        <TrashIcon />
                      </IconButton>
                      <FieldDataCard
                        field={stratum}
                        trigger={
                          <Flex gap="2" align="center">
                            <Text>{stratum.field_name}</Text>
                            <DataTypeBadge type={stratum.data_type} />
                          </Flex>
                        }
                      />
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </Flex>
  );
}
