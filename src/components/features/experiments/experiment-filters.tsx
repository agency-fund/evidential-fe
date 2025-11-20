'use client';
import { Badge, Button, Checkbox, DropdownMenu, Flex, Text, Separator } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';
import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface ExperimentFiltersProps {
  statusOptions: FilterOption[];
  onFiltersChange: (filters: { status: string[] }) => void;
}

export function ExperimentFilters({ statusOptions, onFiltersChange }: ExperimentFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [appliedStatuses, setAppliedStatuses] = useState<string[]>([]);

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleApply = () => {
    setAppliedStatuses(selectedStatuses);
    onFiltersChange({
      status: selectedStatuses,
    });
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedStatuses([]);
    setAppliedStatuses([]);
    onFiltersChange({
      status: [],
    });
  };

  const handleRemoveStatusFilters = () => {
    setAppliedStatuses([]);
    setSelectedStatuses([]);
    onFiltersChange({
      status: [],
    });
  };

  const activeFilterCount = appliedStatuses.length;

  return (
    <Flex gap="2" align="center">
       {activeFilterCount > 0 && (
        <Badge size="2" color="blue" style={{ cursor: 'pointer' }}>
          Status ({activeFilterCount})
          <Cross2Icon
            style={{ marginLeft: '4px' }}
            onClick={handleRemoveStatusFilters}
          />
        </Badge>
      )}
      <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenu.Trigger>
          <Button variant="soft">
            Filter
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content size="2" style={{ minWidth: '280px' }}>
          <Flex direction="column" gap="3" p="2">
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" color="gray">
                Status
              </Text>
              <Flex direction="column" gap="2">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <Checkbox
                      checked={selectedStatuses.includes(option.value)}
                      onCheckedChange={() => handleStatusToggle(option.value)}
                    />
                    <Text size="2">
                      {option.label} ({option.count})
                    </Text>
                  </label>
                ))}
              </Flex>
            </Flex>

            <Separator size="4" />

            <Flex gap="2">
              <Button size="2" variant="soft" onClick={handleClear} style={{ flex: 1 }}>
                Clear
              </Button>
              <Button size="2" onClick={handleApply} style={{ flex: 1 }}>
                Apply
              </Button>
            </Flex>
          </Flex>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Flex>
  );
}
