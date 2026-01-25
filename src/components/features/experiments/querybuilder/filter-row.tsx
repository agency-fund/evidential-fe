'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Flex, Grid, IconButton, Popover, ScrollArea, Text, TextField } from '@radix-ui/themes';
import { TrashIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { DataType, FilterInput } from '@/api/methods.schemas';
import { TypeSpecificFilterInput } from '@/components/features/experiments/querybuilder/type-specific-filter-input';
import { DataTypeBadge } from '@/components/ui/data-type-badge';

function getSearchboxCursorPosition(ref: HTMLInputElement | null): number | undefined {
  // Get the current cursor position if the ref is an input element
  if (ref === null) return undefined;

  let selectionStart: number | null = null;
  if (ref.tagName === 'INPUT') {
    selectionStart = ref.selectionStart;
  }
  return selectionStart ?? undefined;
}

function setSearchboxCursorPosition(ref: HTMLInputElement | null, position: number | undefined) {
  if (ref && ref.tagName !== 'INPUT') {
    // See if we can find it as an ancestor
    ref = ref.querySelector('input');
  }
  if (ref && ref.tagName === 'INPUT') {
    const inputElement = ref as HTMLInputElement;
    inputElement.focus();
    if (position && position >= 0) {
      inputElement.setSelectionRange(position, position);
    }
  }
}

export interface FilterRowOption {
  field_name: string;
  data_type: DataType;
}

export interface FilterRowProps {
  filter: FilterInput;
  availableOptions: Array<FilterRowOption>;
  onSelect: (selectedOption: FilterRowOption) => void;
  onUpdate: (filterRowChange: FilterInput) => void;
  onRemove: () => void;
}

export function FilterRow({ filter, availableOptions, onSelect, onUpdate, onRemove }: FilterRowProps) {
  // State for the search input part of our combobox
  const [searchText, setSearchText] = useState(filter.field_name);
  // State for the dropdown part of our combobox
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // Which index in the dropdown is highlighted; used for keyboard navigation
  const [popoverHighlightedIndex, setPopoverHighlightedIndex] = useState(-1);
  // Cursor position within our search box to restore after filter updates
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined);
  // Ref for the array of dropdown items; used to scroll the highlighted item into view
  const popoverItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Ref for the combobox's TextField representing the search box input element
  const textFieldRootRef = useRef<HTMLInputElement>(null);

  // Find exact match for current search text
  const exactMatch = availableOptions.find((f) => f.field_name === searchText);

  // Filter fields based on search text (case-insensitive)
  const filteredFields = useMemo(() => {
    if (!searchText) return availableOptions;
    const lowerSearch = searchText.toLowerCase();
    return availableOptions.filter((f) => f.field_name.toLowerCase().includes(lowerSearch));
  }, [availableOptions, searchText]);

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

  // Maintain focus on the TextField during a re-render when cursorPosition is set
  // NOTE: Requires the row to have a stable key for this to work properly!
  useEffect(() => {
    if (cursorPosition !== undefined && textFieldRootRef.current) {
      setSearchboxCursorPosition(textFieldRootRef.current, cursorPosition);
      setCursorPosition(undefined);
    }
  }, [cursorPosition]);

  // Handler for selecting a field fills in the full field name and closes the dropdown.
  // It fires under several situations:
  // - User clicks on a field in the dropdown
  // - User types a field name and presses enter
  // - User types a field name and matches exactly one field
  const handleOptionSelect = (newOption: FilterRowOption) => {
    setSearchText(newOption.field_name);
    setIsPopoverOpen(false);
    onSelect(newOption);
  };

  // Search box handler updates our searchText state and other side effects based on the input.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);

    // Check for exact match and auto-select the field if found
    const matchedOption = availableOptions.find((f) => f.field_name === value);
    if (matchedOption) {
      handleOptionSelect(matchedOption);
    } else {
      // If we previously had a valid filter selected but now don't have a match,
      // reset to empty filter to prevent stale filter data from being used
      const hadValidFilter = filter.field_name && availableOptions.find((f) => f.field_name === filter.field_name);
      if (hadValidFilter) {
        // Capture cursor position before updating
        const currentCursorPosition = getSearchboxCursorPosition(textFieldRootRef.current);
        setCursorPosition(currentCursorPosition);
        onUpdate({
          field_name: value,
          relation: 'includes',
          value: [],
        });
      }

      if (!isPopoverOpen) {
        // Since handling the selection of a field closes the dropdown, we re-open it if the user
        // edited the field such that we no longer have an exact match.
        setIsPopoverOpen(true);
      }
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
      // Since we appear to be interacting within the popover, avoid closing it here to allow click
      // events on dropdown items, which will handle the close itself in handleFieldSelect().
      return;
    }
    setIsPopoverOpen(false);
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
        handleOptionSelect(filteredFields[popoverHighlightedIndex]);
      } else if (filteredFields.length === 1) {
        // Only one option while the user is typing and presses enter without highlighting first
        handleOptionSelect(filteredFields[0]);
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

        {/*
          Our combobox implementation uses a Popover, with the input box as the Trigger,
          and a scrollable list of fields as Content for the dropdown.
        */}
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
                ref={textFieldRootRef}
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
                        onClick={() => handleOptionSelect(field)}
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
          <TypeSpecificFilterInput dataType={exactMatch.data_type} filter={filter} onChange={onUpdate} />
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
