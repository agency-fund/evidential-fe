'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Flex, Popover, ScrollArea, Text, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useDebounceFunction } from './use-debounced-function';

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
  // Required props
  options: TOption[];
  onSelect: (option: TOption) => void;
  /** Function to find an exact match within the available options given the search text. */
  findExactMatch: (searchText: string, options: TOption[]) => TOption | undefined;
  /**
   * If an option is selected, this function is used to get the text to display in the search box.
   * Must be usable as a unique identifier for the option.
   */
  getSearchTextFromOption: (option: TOption) => string;

  // Controlled mode (optional) - if inputValue is provided, the component is controlled
  /** Controlled input value. If provided, the component is controlled and onInputChange should also be provided. */
  inputValue?: string;
  /** Called on every input change when in controlled mode. */
  onInputChange?: (value: string) => void;

  // Uncontrolled mode (optional) - used when inputValue is not provided
  /** Initial search text for uncontrolled mode. Ignored if inputValue is provided. */
  initialSearchText?: string;
  /** Handler called when search text changes and there's no exact match. Only used in uncontrolled mode. */
  onNoMatch?: (searchText: string) => void;

  // Optional customization
  /** Whether to initially focus the search box. */
  initFocused?: boolean;
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
  Combobox implementation that internally uses a Popover, with the input box as the Trigger, and a
  scrollable list of fields as Content for the dropdown.
*/
export function Combobox<TOption = string>({
  options,
  onSelect,
  findExactMatch,
  getSearchTextFromOption,
  inputValue,
  onInputChange,
  initialSearchText = '',
  onNoMatch,
  initFocused = false,
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
  // Support both controlled and uncontrolled modes
  const isControlled = inputValue !== undefined;
  const [internalValue, setInternalValue] = useState(initialSearchText);
  const searchText = isControlled ? inputValue : internalValue;

  const setSearchText = (value: string) => {
    if (!isControlled) {
      setInternalValue(value);
    }
    onInputChange?.(value);
  };
  // State for the dropdown part of our combobox
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverHighlightedIndex, setPopoverHighlightedIndex] = useState(-1);
  const popoverItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // onNoMatch is only used in uncontrolled mode; in controlled mode, parent can derive no-match from inputValue
  const noopCallback = () => {};
  const [debouncedOnNoMatch, clearDebouncedOnNoMatch] = useDebounceFunction(onNoMatch ?? noopCallback, 100);
  // State for use in resetting highlighted index when filtered results change
  const [prevFilteredOptionsLength, setPrevFilteredOptionsLength] = useState(options.length);

  // Filter options based on search text (case-insensitive)
  const filteredOptions = useMemo(() => {
    return filterOptions(searchText, options, getSearchTextFromOption);
  }, [options, searchText, getSearchTextFromOption]);

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

  // Handler for auto-selecting when user types an exact match.
  const handleAutoSelect = (option: TOption, closePopover: boolean) => {
    clearDebouncedOnNoMatch();
    if (closePopover) {
      setIsPopoverOpen(false);
      setPopoverHighlightedIndex(-1);
    }
    setSearchText(getSearchTextFromOption(option));
    onSelect(option);
  };

  // Handler for selecting an option that fills in the search text and closes the dropdown.
  // It fires under several situations:
  // - User highlights a field in the dropdown and presses enter
  // - User while typing, filters the options down to only 1, and presses enter
  // - User clicks on a field in the dropdown
  // (For auto-select while typing, see handleAutoSelect.)
  const handleOptionSelect = (option: TOption) => {
    handleAutoSelect(option, true);
  };

  // Search box handler that updates our search text state and other side effects based on the input.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchText(newValue);
    setIsPopoverOpen(true);

    // Check for exact match and auto-select the option if found.
    const newExactMatch = findExactMatch(newValue, options);
    if (newExactMatch) {
      // Only close the popover if it's the only matching option.
      // Must recompute filtered options here since the existing value is stale until next render.
      const newFilteredOptions = filterOptions(newValue, options, getSearchTextFromOption);
      handleAutoSelect(newExactMatch, newFilteredOptions.length === 1);
    } else {
      debouncedOnNoMatch(newValue);
    }
  };

  // Search box handler for when the input gains focus.
  const handleInputFocus = (e: React.FocusEvent) => {
    setIsPopoverOpen(true);
    onFocus?.(e);
  };

  // Search box handler for when the input loses focus.
  const handleInputBlur = (e: React.FocusEvent) => {
    // We use a custom data attribute to identify the Popover.Content element that renders our dropdown.
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest(`[${dropdownDataAttribute}]`)) {
      // Since we appear to be interacting within the popover, avoid closing it here to allow click
      // events on dropdown items, which will handle the close itself in handleOptionSelect().
      return;
    }
    setIsPopoverOpen(false);
    onBlur?.(e);
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
      setPopoverHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPopoverHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (popoverHighlightedIndex >= 0 && popoverHighlightedIndex < filteredOptions.length) {
        handleOptionSelect(filteredOptions[popoverHighlightedIndex]);
      } else if (filteredOptions.length === 1) {
        // Only one option while the user is typing and presses enter without highlighting first
        handleOptionSelect(filteredOptions[0]);
      }
    }
    onKeyDown?.(e);
  };

  // Default left slot
  const defaultLeftSlot = leftSlot ?? <MagnifyingGlassIcon height="16" width="16" />;

  // Default dropdown row renderer
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
            value={searchText}
            autoFocus={initFocused}
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
                      // Store the ref for this item in case we need to scroll it into view.
                      popoverItemRefs.current[index] = el;
                    }}
                    onClick={() => handleOptionSelect(option)}
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
