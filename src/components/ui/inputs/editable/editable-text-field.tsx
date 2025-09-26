'use client';

import { useState, ReactNode } from 'react';
import { Flex, TextField } from '@radix-ui/themes';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { BaseEditableProps } from '@/components/ui/inputs/editable/types';
import { BUTTON_LAYOUTS } from '@/components/ui/inputs/editable/utils';
import { EditActionButtons } from '@/components/ui/inputs/editable/edit-action-buttons';

interface EditableTextFieldProps<T = Record<string, any>> extends BaseEditableProps<T> {
  children: ReactNode;
}

export function EditableTextField<T = Record<string, any>>({
  value,
  fieldKey,
  inputSize = '3',
  onUpdate,
  isUpdating = false,
  children,
  buttonPlacement = 'inline-right',
}: EditableTextFieldProps<T>) {
  const [editing, setEditing] = useState(false);
  const layout = BUTTON_LAYOUTS[buttonPlacement];
  const isRow = layout.direction === 'row';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const newValue = formData.get(fieldKey as string) as string;

    if (newValue.trim() && newValue !== value) {
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
                type="text"
                defaultValue={value}
                size={inputSize}
                disabled={isUpdating}
                autoFocus
                style={{ width: '100%' }}
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
    <Flex gap="2" align="start" justify="between" width="100%">
      {children}
      <EditIconButton onClick={() => setEditing(true)} />
    </Flex>
  );
}
