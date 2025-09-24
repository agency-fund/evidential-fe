'use client';

import { useState } from 'react';
import { Button, Flex, Text, TextField } from '@radix-ui/themes';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { isoStringToDateInput, dateInputToIsoString } from '@/services/date-utils';

interface EditableDateFieldProps {
  initialValue: string; // ISO date string
  fieldKey: string;
  textSize?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  textFieldSize?: '1' | '2' | '3';
  displayValue?: string; // Optional formatted display value
  onUpdate: (formData: FormData) => Promise<void>;
  isUpdating?: boolean;
}

export function EditableDateField({
  initialValue,
  fieldKey,
  textSize = '3',
  textFieldSize = '1',
  displayValue,
  onUpdate,
  isUpdating = false,
}: EditableDateFieldProps) {
  const [editing, setEditing] = useState(false);
  const displayText = displayValue || new Date(initialValue).toLocaleDateString();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const newValue = formData.get(fieldKey) as string;

    if (newValue && newValue !== isoStringToDateInput(initialValue)) {
      const processedValue = dateInputToIsoString(newValue);
      formData.set(fieldKey, processedValue);

      try {
        await onUpdate(formData);
        setEditing(false);
      } catch (error) {
        console.error('Update failed:', error);
      }
    } else {
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Flex direction="column" gap="2">
        <form onSubmit={handleSubmit}>
          <Flex gap="2" align="center">
            <TextField.Root
              name={fieldKey}
              type="date"
              defaultValue={isoStringToDateInput(initialValue)}
              size={textFieldSize}
              disabled={isUpdating}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditing(false);
                }
              }}
              autoFocus
            />
            <Button type="submit" size="1" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
            <Button type="button" size="1" variant="soft" onClick={() => setEditing(false)} disabled={isUpdating}>
              Cancel
            </Button>
          </Flex>
        </form>
      </Flex>
    );
  }

  return (
    <Flex gap="2" align="center">
      <Text size={textSize}>{displayText}</Text>
      <EditIconButton onClick={() => setEditing(true)} />
    </Flex>
  );
}
