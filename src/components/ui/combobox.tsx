'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Flex, Popover, ScrollArea, Text, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

// Helper for computing filtered options with a different search text (used in handlers)
const filterOptions = <TOption = string,>(
  text: string,
  options: TOption[],
  getDisplayTextForOption: (option: TOption) => string,
) => {
  if (!text) return options;
  const lowerSearch = text.toLowerCase();
  return options.filter((opt) => getDisplayTextForOption(opt).toLowerCase().includes(lowerSearch));
};

export interface DropdownRowProps<TOption> {
  option: TOption;
  isHighlighted: boolean;
  index: number;
}

type DropdownRow<TOption = string> = (props: DropdownRowProps<TOption>) => React.ReactNode;

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
  /** The current input value. */
  value: string;
  /**
   * Called on every input change (typing or selection).
   * value - The new text value
   */
  onChange: (value: string) => void;

  /** The array of items to present */
  options: TOption[];
  /**
   * Returns the text to display for an option (used for filtering and display).
   */
  getDisplayTextForOption: (option: TOption) => string;
  /**
   * Returns a unique key/identifier for an option (used for React keys).
   */
  getKeyForOption: (option: TOption) => string;

  /** Whether to focus on the search box. */
  autoFocus?: boolean;
  placeholder?: string;
  noMatchText?: string;
  /** Component to display to the left side of the search box. Defaults to a magnifying glass icon. */
  leftSlot?: React.ReactNode;
  /** Component to display to the right side of the search box. */
  rightSlot?: React.ReactNode;

  /** The element to render for each selectable/searchable row. */
  dropdownRow?: DropdownRow<TOption>;

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
  getDisplayTextForOption,
  getKeyForOption,
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

  // Filter options based on input value (case-insensitive)
  const filteredOptions = filterOptions(value, options, getDisplayTextForOption);

  // If filteredOptions changes, existing refs and highlight indexes will be potentially stale,
  // so we clear them.
  useEffect(() => {
    setPopoverHighlightedIndex(-1);
    popoverItemRefs.current = [];
  }, [filteredOptions.length]);

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
    onChange(getDisplayTextForOption(option));
  };

  // Search box handler for input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPopoverOpen(true);
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Search box handler for when the input gains focus
  const handleInputFocus = () => setIsPopoverOpen(true);

  // Search box handler for when the input loses focus
  const handleInputBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (relatedTarget?.closest(`[${dropdownDataAttribute}]`)) {
      // Interacting within the popover, let click handler close it
      return;
    }
    setIsPopoverOpen(false);
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
  };

  const defaultLeftSlot = leftSlot ?? <MagnifyingGlassIcon height="16" width="16" />;

  const renderDropdownRow =
    dropdownRow ??
    ((props: DropdownRowProps<TOption>) => <DefaultComboboxRow optionText={getDisplayTextForOption(props.option)} />);

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
                    key={getKeyForOption(option)}
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
