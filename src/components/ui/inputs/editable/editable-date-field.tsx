'use client';

import { useState } from 'react';
import { Flex, Text, TextField } from '@radix-ui/themes';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { isoStringToDateInput, dateInputToIsoString } from '@/services/date-utils';
import { BaseEditableProps } from '@/components/ui/inputs/editable/types';
import { BUTTON_LAYOUTS } from '@/components/ui/inputs/editable/utils';
import { EditActionButtons } from '@/components/ui/inputs/editable/edit-action-buttons';

interface EditableDateFieldProps<T = Record<string, any>> extends Omit<BaseEditableProps<T>, 'value'> {
  isoValue: string;
}

export function EditableDateField<T = Record<string, any>>({
  isoValue,
  fieldKey,
  inputSize = '1',
  onUpdate,
  isUpdating = false,
  buttonPlacement = 'inline-right',
}: EditableDateFieldProps<T>) {
  const [editing, setEditing] = useState(false);
  const displayText = new Date(isoValue).toLocaleDateString();
  const layout = BUTTON_LAYOUTS[buttonPlacement];
  const isRow = layout.direction === 'row';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const newValue = formData.get(fieldKey as string) as string;

    if (newValue && newValue !== isoStringToDateInput(isoValue)) {
      const processedValue = dateInputToIsoString(newValue);
      formData.set(fieldKey as string, processedValue);

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
          <Flex direction={layout.direction} gap="2" align={layout.align}>
            <Flex flexGrow={isRow ? '1' : undefined}>
              <TextField.Root
                name={fieldKey as string}
                type="date"
                defaultValue={isoStringToDateInput(isoValue)}
                size={inputSize}
                disabled={isUpdating}
                autoFocus
              />
            </Flex>
            <Flex gap="1" justify={layout.justify}>
              <EditActionButtons disabled={isUpdating} onCancel={() => setEditing(false)} />
            </Flex>
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
