'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Flex, Popover, ScrollArea, Text, TextField } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

const getSearchboxCursorPosition = (ref: HTMLInputElement | null): number | undefined => {
  if (ref === null) return undefined;

  // Get the current cursor position if the ref is an input element
  let selectionStart: number | null = null;
  if (ref.tagName === 'INPUT') {
    selectionStart = ref.selectionStart;
  }
  return selectionStart ?? undefined;
};

const setSearchboxCursorPosition = (ref: HTMLInputElement | null, position: number | undefined) => {
  if (ref && ref.tagName !== 'INPUT') {
    // See if we can find it among descendants
    ref = ref.querySelector('input');
  }
  if (ref && ref.tagName === 'INPUT') {
    const inputElement = ref as HTMLInputElement;
    inputElement.focus();
    if (position && position >= 0) {
      inputElement.setSelectionRange(position, position);
    }
  }
};

export interface DropdownRowProps<TOption> {
  option: TOption;
  isHighlighted: boolean;
  isSelected: boolean;
  index: number;
}

export interface ComboboxProps<TOption = string> {
  // Required props
  options: TOption[];
  onSelect: (option: TOption) => void;
  /** Handler to notify user when we had a match but now a mismatch between the search text and the available options. */
  onNoMatch: (searchText: string) => void;
  /** Function to find an exact match within the available options given the search text. */
  findExactMatch: (searchText: string, options: TOption[]) => TOption | undefined;
  /** If an option is selected, this function is used to get the text to display in the search box. */
  getSearchTextFromOption: (option: TOption) => string;

  // Optional customization
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
  onNoMatch,
  findExactMatch,
  getSearchTextFromOption,
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
  // State for the search input text (kept for exactMatch calculation)
  const [searchText, setSearchText] = useState('');
  // State for the dropdown part of our combobox
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  // Which index in the dropdown is highlighted; used for keyboard navigation
  const [popoverHighlightedIndex, setPopoverHighlightedIndex] = useState(-1);
  // Cursor position within our search box to restore after updates
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined);
  // Ref for the array of dropdown items; used to scroll the highlighted item into view
  const popoverItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Ref for the combobox's TextField representing the search box input element
  const textFieldRootRef = useRef<HTMLInputElement>(null);

  // Find exact match for current search text
  const exactMatchOption = findExactMatch(searchText, options);

  // Filter options based on search text (case-insensitive)
  const filteredOptions = useMemo(() => {
    if (!searchText) return options;
    const lowerSearch = searchText.toLowerCase();
    return options.filter((opt) => getSearchTextFromOption(opt).toLowerCase().includes(lowerSearch));
  }, [options, searchText, getSearchTextFromOption]);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setPopoverHighlightedIndex(-1);
  }, [filteredOptions.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (popoverHighlightedIndex >= 0 && popoverItemRefs.current[popoverHighlightedIndex]) {
      popoverItemRefs.current[popoverHighlightedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [popoverHighlightedIndex]);

  // Maintain focus on the TextField during a re-render when cursorPosition is set
  // NOTE: Requires the component to have a stable key for this to work properly!
  useEffect(() => {
    if (cursorPosition !== undefined && textFieldRootRef.current) {
      setSearchboxCursorPosition(textFieldRootRef.current, cursorPosition);
      setCursorPosition(undefined);
    }
  }, [cursorPosition]);

  // Handler for selecting an option that fills in the search text and closes the dropdown.
  // It fires under several situations:
  // - User types a field name and matches exactly one field
  // - User hightlights a field in the dropdown and presses enter
  // - User types text, filtering the options down to only 1 and presses enter
  // - User clicks on a field in the dropdown
  const handleOptionSelect = (option: TOption) => {
    const optionText = getSearchTextFromOption(option);
    setSearchText(optionText);
    setIsPopoverOpen(false);
    onSelect(option);
  };

  // Search box handler that updates our search text state and other side effects based on the input.
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchText(newValue);

    // Check for exact match and auto-select the option if found
    const newExactMatch = findExactMatch(newValue, options);
    if (newExactMatch) {
      handleOptionSelect(newExactMatch);
    } else {
      // If we previously had a valid option selected but now don't have a match,
      // call onUpdate to notify parent and preserve the cursor position.
      // TODO? Would it be better to always call onNoMatch here instead of only when an edit causes it?
      if (exactMatchOption && onNoMatch) {
        const currentCursorPosition = getSearchboxCursorPosition(textFieldRootRef.current);
        setCursorPosition(currentCursorPosition);
        onNoMatch(newValue);
      }

      if (!isPopoverOpen) {
        // Since handling the selection of an option closes the dropdown, we re-open it if the user
        // edited the field such that we no longer have an exact match.
        setIsPopoverOpen(true);
      }
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
            ref={textFieldRootRef}
            placeholder={placeholder}
            value={searchText}
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
                const isSelected = getSearchTextFromOption(option) === searchText;
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
                      backgroundColor: isHighlighted || isSelected ? 'var(--gray-3)' : undefined,
                    }}
                  >
                    {renderDropdownRow({ option, isHighlighted, isSelected, index })}
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
