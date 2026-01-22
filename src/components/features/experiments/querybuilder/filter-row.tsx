'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Flex, Grid, IconButton, Popover, ScrollArea, Text, TextField } from '@radix-ui/themes';
import { TrashIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import { TypeSpecificFilterInput } from '@/components/features/experiments/querybuilder/type-specific-filter-input';
import { getDefaultFilterForType } from '@/components/features/experiments/querybuilder/utils';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

export interface FilterRowProps {
  filter: FilterInput;
  availableFields: Array<{
    field_name: string;
    data_type: DataType;
    description: string;
  }>;
  onChange: (filter: FilterInput) => void;
  onRemove: () => void;
}

export function FilterRow({ filter, availableFields, onChange, onRemove }: FilterRowProps) {
  // State for the search input part of our combobox
  const [searchText, setSearchText] = useState(filter.field_name);
  // State for the dropdown part of our combobox
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // Which index in the dropdown is highlighted; used for keyboard navigation
  const [popoverHighlightedIndex, setPopoverHighlightedIndex] = useState(-1);
  // Ref for the array of dropdown items; used to scroll the highlighted item into view
  const popoverItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find exact match for current search text
  const exactMatch = availableFields.find((f) => f.field_name === searchText);

  // Filter fields based on search text (case-insensitive)
  const filteredFields = useMemo(() => {
    if (!searchText) return availableFields;
    const lowerSearch = searchText.toLowerCase();
    return availableFields.filter((f) => f.field_name.toLowerCase().includes(lowerSearch));
  }, [availableFields, searchText]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setPopoverHighlightedIndex(-1);
  }, [filteredFields.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (popoverHighlightedIndex >= 0 && popoverItemRefs.current[popoverHighlightedIndex]) {
      popoverItemRefs.current[popoverHighlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [popoverHighlightedIndex]);

  // Keep searchText in sync with filter.field_name when it changes externally
  useEffect(() => {
    setSearchText(filter.field_name);
  }, [filter.field_name]);

  // Handler for selecting a field fills in the full field name and closes the dropdown.
  // It fires under several situations:
  // - User clicks on a field in the dropdown
  // - User types a field name and presses enter
  // - User types a field name and matches exactly one field
  const handleFieldSelect = (fieldName: string) => {
    const newField = availableFields.find((f) => f.field_name === fieldName);
    if (!newField) return;

    setSearchText(fieldName);
    setIsPopoverOpen(false);

    // Reset the filter with appropriate defaults for the new field type
    const defaultFilter = getDefaultFilterForType(fieldName, newField.data_type);
    onChange(defaultFilter);
  };

  // Search box handler updates our searchText state and other side effects based on the input.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    // Check for exact match and auto-select the field if found
    const matchedField = availableFields.find((f) => f.field_name === value);
    if (matchedField) {
      handleFieldSelect(value);
    } else if (!isPopoverOpen) {
      // Since handling the selection of a field closes the dropdown, we re-open it if the user
      // edited the field such that we no longer have an exact match.
      setIsPopoverOpen(true);
    }
  };

  // Search box handler for when the input gains focus.
  const handleInputFocus = () => {
    setIsPopoverOpen(true);
  };

  // Search box handler for when the input loses focus.
  const handleInputBlur = (e: React.FocusEvent) => {
    // We use a custom data attribute to identify the Popover.Content element that renders our dropdown.
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('[data-filter-dropdown]')) {
      // Delay closing the popover to allow click events on dropdown items, which lets
      // handleFieldSelect() close the popover.
      return;
    }
    setTimeout(() => setIsPopoverOpen(false), 150);
  };

  // Search box handler for when the user presses a key while interacting with the combobox.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsPopoverOpen(false);
      (e.target as HTMLInputElement)?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isPopoverOpen) {
        setIsPopoverOpen(true);
      }
      setPopoverHighlightedIndex((prev) => (prev < filteredFields.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPopoverHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (popoverHighlightedIndex >= 0 && popoverHighlightedIndex < filteredFields.length) {
        handleFieldSelect(filteredFields[popoverHighlightedIndex].field_name);
      } else if (filteredFields.length === 1) {
        // Only one option while the user is typing and presses enter without highlighting first
        handleFieldSelect(filteredFields[0].field_name);
      }
    }
  };

  return (
    <Grid columns={'2'} width={'auto'} gap={'3'}>
      <Flex gap={'2'} align={'start'}>
        <IconButton
          variant="soft"
          color="red"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
          }}
        >
          <TrashIcon />
        </IconButton>

        {/* Implementation of our combobox uses a a Popover, with the input box as the Trigger, and
        a scrollable list of fields as Content for the dropdown. */}
        <Popover.Root
          open={isPopoverOpen}
          onOpenChange={(open) => {
            // Only allow closing via our controlled handlers, not via Popover's internal logic
            if (!open) return;
            setIsPopoverOpen(true);
          }}
        >
          <Popover.Trigger>
            <Box minWidth="200px">
              <TextField.Root
                placeholder="Search fields..."
                value={searchText}
                onChange={handleSearchChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
              >
                <TextField.Slot>
                  <MagnifyingGlassIcon height="16" width="16" />
                </TextField.Slot>
                {exactMatch && (
                  <TextField.Slot>
                    <DataTypeBadge type={exactMatch.data_type} />
                  </TextField.Slot>
                )}
              </TextField.Root>
            </Box>
          </Popover.Trigger>

          <Popover.Content
            data-filter-dropdown
            side="bottom"
            align="start"
            sideOffset={4}
            style={{ minWidth: 'var(--radix-popover-trigger-width)', padding: 0 }}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <ScrollArea scrollbars="vertical" style={{ maxHeight: '200px' }}>
              {filteredFields.length === 0 ? (
                <Flex p="3" justify="center">
                  <Text size="2" color="gray">
                    No matching fields
                  </Text>
                </Flex>
              ) : (
                <Flex direction="column">
                  {filteredFields.map((field, index) => {
                    const isHighlighted = index === popoverHighlightedIndex;
                    const isSelected = field.field_name === searchText;
                    return (
                      <Box
                        key={field.field_name}
                        ref={(el) => {
                          // Store the ref for this item in case we need to scroll it into view.
                          popoverItemRefs.current[index] = el;
                        }}
                        onClick={() => handleFieldSelect(field.field_name)}
                        onMouseEnter={() => setPopoverHighlightedIndex(index)}
                        py="2"
                        px="3"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isHighlighted || isSelected ? 'var(--gray-3)' : undefined,
                        }}
                      >
                        <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
                          <Text size="2">{field.field_name}</Text>
                          <DataTypeBadge type={field.data_type} />
                        </Flex>
                      </Box>
                    );
                  })}
                </Flex>
              )}
            </ScrollArea>
          </Popover.Content>
        </Popover.Root>
      </Flex>

      {/* Filter options for the selected filter field or help text */}
      <Flex gap={'2'} align={'center'}>
        {exactMatch ? (
          <TypeSpecificFilterInput dataType={exactMatch.data_type} filter={filter} onChange={onChange} />
        ) : searchText === '' ? (
          <Text size="2" color="gray">
            ← Select a field
          </Text>
        ) : (
          <Text size="2" color="red">
            Invalid field — select from dropdown or type the name
          </Text>
        )}
      </Flex>
    </Grid>
  );
}
