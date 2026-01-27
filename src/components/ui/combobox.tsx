'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Flex, Popover, ScrollArea, Text, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

// Filter options by search text (case-insensitive substring match)
const filterOptions = <TOption,>(
  searchText: string,
  options: TOption[],
  getSearchTextFromOption: (option: TOption) => string,
): TOption[] => {
  if (!searchText) return options;
  const lowerSearch = searchText.toLowerCase();
  return options.filter((opt) => getSearchTextFromOption(opt).toLowerCase().includes(lowerSearch));
};

export interface DropdownRowProps<TOption> {
  option: TOption;
  isHighlighted: boolean;
  index: number;
}

export interface ComboboxProps<TOption = string> {
  // Controlled input (required)
  /** The current input value. */
  inputValue: string;
  /** Called on every input change with the new value and resulting filtered options. */
  onChange: (value: string, filteredOptions: TOption[]) => void;

  // Controlled open state (required)
  /** Whether the dropdown is open. */
  open: boolean;
  /** Called when the dropdown should open or close. */
  onOpenChange: (open: boolean) => void;

  // Options and selection (required)
  options: TOption[];
  /** Called when user explicitly selects an option (click or Enter). */
  onSelect: (option: TOption) => void;
  /** Returns the display text for an option. Must be unique per option. */
  getSearchTextFromOption: (option: TOption) => string;

  // Optional customization
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
 * Fully controlled combobox. Parent owns both the input value and open state.
 */
export function Combobox<TOption = string>({
  inputValue,
  onChange,
  open,
  onOpenChange,
  options,
  onSelect,
  getSearchTextFromOption,
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
  dropdownDataAttribute = 'data-combobox-dropdown',
}: ComboboxProps<TOption>) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Filtered options as state - computed in handlers and updated when props change
  const [filteredOptions, setFilteredOptions] = useState<TOption[]>(() =>
    filterOptions(inputValue, options, getSearchTextFromOption),
  );

  // Track previous props to detect external changes
  const [prevOptions, setPrevOptions] = useState(options);
  const [prevInputValue, setPrevInputValue] = useState(inputValue);
  const [prevFilteredLength, setPrevFilteredLength] = useState(filteredOptions.length);

  // Recompute filtered options when props change externally (not via our handlers)
  if (options !== prevOptions || inputValue !== prevInputValue) {
    setPrevOptions(options);
    setPrevInputValue(inputValue);
    const newFiltered = filterOptions(inputValue, options, getSearchTextFromOption);
    setFilteredOptions(newFiltered);
  }

  // Reset highlighted index when filtered results change
  if (filteredOptions.length !== prevFilteredLength) {
    setPrevFilteredLength(filteredOptions.length);
    setHighlightedIndex(-1);
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleSelect = (option: TOption) => {
    setHighlightedIndex(-1);
    const optionText = getSearchTextFromOption(option);
    const newFiltered = filterOptions(optionText, options, getSearchTextFromOption);
    setFilteredOptions(newFiltered);
    onChange(optionText, newFiltered);
    onSelect(option);
    onOpenChange(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const newFiltered = filterOptions(newValue, options, getSearchTextFromOption);
    setFilteredOptions(newFiltered);
    onChange(newValue, newFiltered);
    onOpenChange(true);
  };

  const handleInputFocus = (e: React.FocusEvent) => {
    onOpenChange(true);
    onFocus?.(e);
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest(`[${dropdownDataAttribute}]`)) {
      // Clicking within popover, let click handler handle it
      return;
    }
    onOpenChange(false);
    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
      (e.target as HTMLInputElement)?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        onOpenChange(true);
      }
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex]);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0]);
      }
    }
    onKeyDown?.(e);
  };

  const defaultLeftSlot = leftSlot ?? <MagnifyingGlassIcon height="16" width="16" />;

  const defaultDropdownRow = (props: DropdownRowProps<TOption>) => (
    <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
      <Text size="2">{getSearchTextFromOption(props.option)}</Text>
    </Flex>
  );

  const renderDropdownRow = dropdownRow ?? defaultDropdownRow;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(newOpen) => {
        // Only allow Popover to open, not close (we handle closing via blur/escape/select)
        if (newOpen) onOpenChange(true);
      }}
    >
      <Popover.Trigger>
        <Box minWidth={minWidth}>
          <TextField.Root
            placeholder={placeholder}
            value={inputValue}
            autoFocus={autoFocus}
            onChange={handleInputChange}
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
                const isHighlighted = index === highlightedIndex;
                return (
                  <Box
                    key={getSearchTextFromOption(option)}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
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
