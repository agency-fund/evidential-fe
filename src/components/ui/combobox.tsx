'use client';

import { useState, useRef, useEffect } from 'react';
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

interface DefaultComboboxRowProps {
  optionText: string;
}

const DefaultComboboxRow = ({ optionText }: DefaultComboboxRowProps) => {
  return (
    <Flex gap="2" align="center" justify="between" style={{ whiteSpace: 'nowrap' }}>
      <Text size="2">{optionText}</Text>
    </Flex>
  );
};

export interface ComboboxProps<TOption = string> {
  // Required - Controlled input
  /** The current input value. */
  value: string;
  /**
   * Called on every input change (typing or selection).
   * value - The new text value
   * selectedOption - The option if user selected from dropdown or typed an exact match
   */
  onChange: (value: string, selectedOption?: TOption) => void;

  // Required - options
  options: TOption[];
  /**
   * Returns the text to display/match for an option.
   * Must be usable as a unique identifier for the option.
   */
  getSearchTextFromOption: (option: TOption) => string;

  // Optional handlers
  onFocus?: (e: React.FocusEvent) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;

  // Optional customization
  /** Whether to focus on the search box. */
  autoFocus?: boolean;
  placeholder?: string;
  noMatchText?: string;
  /** Render a component for the left side of the search box, defaulting to a magnifying glass icon. */
  leftSlot?: React.ReactNode;
  /** Render a component for the right side of the search box. */
  rightSlot?: React.ReactNode;
  dropdownRow?: (props: DropdownRowProps<TOption>) => React.ReactNode;

  // Optional styling/layout
  minWidth?: string;
  maxHeight?: string;
  dropdownDataAttribute?: string;
}

/**
 * Controlled combobox with a text input and a dropdown list of options.
 * Parent owns the input value via value/onChange props.
 */
export function Combobox<TOption = string>({
  value,
  onChange,
  options,
  getSearchTextFromOption,
  onFocus,
  onBlur,
  onKeyDown,
  autoFocus = false,
  placeholder = 'Search...',
  noMatchText = 'No matching options',
  leftSlot,
  rightSlot,
  dropdownRow,
  minWidth = '200px',
  maxHeight = '200px',
  dropdownDataAttribute = 'data-filter-dropdown',
}: ComboboxProps<TOption>) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverHighlightedIndex, setPopoverHighlightedIndex] = useState(-1);
  const popoverItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [prevFilteredOptionsLength, setPrevFilteredOptionsLength] = useState(
    () => filterOptions(value, options, getSearchTextFromOption).length,
  );

  // Filter options based on input value (case-insensitive)
  const filteredOptions = filterOptions(value, options, getSearchTextFromOption);

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

  // Handler for selecting an option from dropdown (click or Enter)
  const handleSelect = (option: TOption, closePopover: boolean) => {
    if (closePopover) {
      setIsPopoverOpen(false);
      setPopoverHighlightedIndex(-1);
    }
    onChange(getSearchTextFromOption(option), option);
  };

  // Find exact match for a given text value
  const findExactMatch = (text: string): TOption | undefined => {
    return options.find((opt) => getSearchTextFromOption(opt) === text);
  };

  // Search box handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPopoverOpen(true);
    const newValue = e.target.value;
    onChange(newValue, findExactMatch(newValue));
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

  const renderDropdownRow =
    dropdownRow ??
    ((props: DropdownRowProps<TOption>) => <DefaultComboboxRow optionText={getSearchTextFromOption(props.option)} />);

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
            value={value}
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
