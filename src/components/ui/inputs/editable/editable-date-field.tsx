'use client';

import { useState } from 'react';
import { Flex, IconButton, Text, TextField, Tooltip } from '@radix-ui/themes';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { isoStringToDateInput, dateInputToIsoString } from '@/services/date-utils';

interface EditableDateFieldProps {
  initialValue: string; // ISO date string
  fieldKey: string;
  textFieldSize?: '1' | '2' | '3';
  displayValue?: string; // Optional formatted display value
  onUpdate: (formData: FormData) => Promise<void>;
  isUpdating?: boolean;
}

export function EditableDateField({
  initialValue,
  fieldKey,
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
              autoFocus
            />
            <Tooltip content="Update">
              <IconButton
                type="submit"
                size="1"
                disabled={isUpdating}
                color="green"
                variant="solid"
              >
                <CheckIcon />
              </IconButton>
            </Tooltip>
            <Tooltip content="Cancel">
              <IconButton
                type="button"
                size="1"
                variant="solid"
                color="red"
                onClick={() => setEditing(false)}
                disabled={isUpdating}
              >
                <Cross2Icon />
              </IconButton>
            </Tooltip>
          </Flex>
        </form>
      </Flex>
    );
  }

  return (
    <Flex gap="2" align="center">
      <Text>{displayText}</Text>
      <EditIconButton onClick={() => setEditing(true)} />
    </Flex>
  );
}
