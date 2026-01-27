'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Flex, Popover, ScrollArea, Text, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

// Helper for computing filtered options with a different search text (used in handlers)
const filterOptions = <TOption = string,>(
  text: string,
  options: TOption[],
  getSearchTextFromOption: (option: TOption) => string,
) => {
  if (!text) return options;
  const lowerSearch = text.toLowerCase();
  return options.filter((opt) => getSearchTextFromOption(opt).toLowerCase().includes(lowerSearch));
};

export interface DropdownRowProps<TOption> {
  option: TOption;
  isHighlighted: boolean;
  index: number;
}

export interface ComboboxProps<TOption = string> {
  // Required - Controlled input
  /** The current input value. */
  inputValue: string;
  /** Called on every input change. */
  onChange: (value: string) => void;

  // Required options and selection
  options: TOption[];
  onSelect: (option: TOption) => void;
  /** Function to find an exact match within the available options given the search text. */
  findExactMatch: (searchText: string, options: TOption[]) => TOption | undefined;
  /**
   * If an option is selected, this function is used to get the text to display in the search box.
   * Must be usable as a unique identifier for the option.
   */
  getSearchTextFromOption: (option: TOption) => string;

  // Optional customization
  /** Whether to initially focus the search box. */
  autoFocus?: boolean;
  placeholder?: string;
  noMatchText?: string;
  /** Render a component for the left side of the search box, defaulting to a magnifying glass icon. */
  leftSlot?: React.ReactNode;
  /** Render a component for the right side of the search box. */
  rightSlot?: React.ReactNode;
  dropdownRow?: (props: DropdownRowProps<TOption>) => React.ReactNode;

  // Optional handlers
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;

  // Optional styling/layout
  minWidth?: string;
  maxHeight?: string;
  dropdownDataAttribute?: string;
}

/**
 * Controlled combobox with a text input and a dropdown list of options.
 * Parent owns the input value via inputValue/onInputChange props.
 */
export function Combobox<TOption = string>({
  options,
  onSelect,
  findExactMatch,
  getSearchTextFromOption,
  inputValue,
  onChange: onInputChange,
  autoFocus = false,
  placeholder = 'Search...',
  noMatchText = 'No matching options',
  leftSlot,
  rightSlot,
  dropdownRow,
  onFocus,
  onBlur,
  onKeyDown,
  minWidth = '200px',
  maxHeight = '200px',
  dropdownDataAttribute = 'data-filter-dropdown',
}: ComboboxProps<TOption>) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverHighlightedIndex, setPopoverHighlightedIndex] = useState(-1);
  const popoverItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [prevFilteredOptionsLength, setPrevFilteredOptionsLength] = useState(options.length);

  // Filter options based on input value (case-insensitive)
  const filteredOptions = useMemo(() => {
    return filterOptions(inputValue, options, getSearchTextFromOption);
  }, [options, inputValue, getSearchTextFromOption]);

  // Reset highlighted index when filtered results change
  if (filteredOptions.length !== prevFilteredOptionsLength) {
    setPrevFilteredOptionsLength(filteredOptions.length);
    setPopoverHighlightedIndex(-1);
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (popoverHighlightedIndex >= 0 && popoverItemRefs.current[popoverHighlightedIndex]) {
      popoverItemRefs.current[popoverHighlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [popoverHighlightedIndex]);

  // Handler for selecting an option (click, Enter, or auto-select on exact match)
  const handleSelect = (option: TOption, closePopover: boolean) => {
    if (closePopover) {
      setIsPopoverOpen(false);
      setPopoverHighlightedIndex(-1);
    }
    onInputChange(getSearchTextFromOption(option));
    onSelect(option);
  };

  // Search box handler for input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onInputChange(newValue);
    setIsPopoverOpen(true);

    // Check for exact match and auto-select if found
    const exactMatch = findExactMatch(newValue, options);
    if (exactMatch) {
      // Only close the popover if it's the only matching option
      const newFilteredOptions = filterOptions(newValue, options, getSearchTextFromOption);
      handleSelect(exactMatch, newFilteredOptions.length === 1);
    }
  };

  // Search box handler for when the input gains focus
  const handleInputFocus = (e: React.FocusEvent) => {
    setIsPopoverOpen(true);
    onFocus?.(e);
  };

  // Search box handler for when the input loses focus
  const handleInputBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest(`[${dropdownDataAttribute}]`)) {
      // Interacting within the popover, let click handler close it
      return;
    }
    setIsPopoverOpen(false);
    onBlur?.(e);
  };

  // Search box handler for keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsPopoverOpen(false);
      (e.target as HTMLInputElement)?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isPopoverOpen) {
        setIsPopoverOpen(true);
      }
      setPopoverHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPopoverHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (popoverHighlightedIndex >= 0 && popoverHighlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[popoverHighlightedIndex], true);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0], true);
      }
    }
    onKeyDown?.(e);
  };

  const defaultLeftSlot = leftSlot ?? <MagnifyingGlassIcon height="16" width="16" />;

  const defaultDropdownRow = (props: DropdownRowProps<TOption>) => {
    const optionText = getSearchTextFromOption(props.option);
    return (
      <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
        <Text size="2">{optionText}</Text>
      </Flex>
    );
  };

  const renderDropdownRow = dropdownRow ?? defaultDropdownRow;

  return (
    <Popover.Root
      open={isPopoverOpen}
      onOpenChange={(open) => {
        // Only allow closing via our controlled handlers, not via Popover's internal logic
        if (!open) return;
        setIsPopoverOpen(true);
      }}
    >
      <Popover.Trigger>
        <Box minWidth={minWidth}>
          <TextField.Root
            placeholder={placeholder}
            value={inputValue}
            autoFocus={autoFocus}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
          >
            <TextField.Slot>{defaultLeftSlot}</TextField.Slot>
            {rightSlot && <TextField.Slot>{rightSlot}</TextField.Slot>}
          </TextField.Root>
        </Box>
      </Popover.Trigger>

      <Popover.Content
        {...{ [dropdownDataAttribute]: true }}
        side="bottom"
        align="start"
        sideOffset={4}
        style={{ minWidth: 'var(--radix-popover-trigger-width)', padding: 0 }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ScrollArea scrollbars="vertical" style={{ maxHeight }}>
          {filteredOptions.length === 0 ? (
            <Flex p="3" justify="center">
              <Text size="2" color="gray">
                {noMatchText}
              </Text>
            </Flex>
          ) : (
            <Flex direction="column">
              {filteredOptions.map((option, index) => {
                const isHighlighted = index === popoverHighlightedIndex;
                return (
                  <Box
                    key={getSearchTextFromOption(option)}
                    ref={(el) => {
                      popoverItemRefs.current[index] = el;
                    }}
                    onClick={() => handleSelect(option, true)}
                    onMouseEnter={() => setPopoverHighlightedIndex(index)}
                    py="2"
                    px="3"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isHighlighted ? 'var(--gray-3)' : undefined,
                    }}
                  >
                    {renderDropdownRow({ option, isHighlighted, index })}
                  </Box>
                );
              })}
            </Flex>
          )}
        </ScrollArea>
      </Popover.Content>
    </Popover.Root>
  );
}
