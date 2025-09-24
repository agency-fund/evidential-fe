'use client';

import { useState } from 'react';
import { Button, Flex, Heading, TextField } from '@radix-ui/themes';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';

interface EditableTextFieldProps {
  initialValue: string;
  fieldKey: string;
  headingSize?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
  textFieldSize?: '1' | '2' | '3';
  displayValue?: string;
  onUpdate: (formData: FormData) => Promise<void>;
  isUpdating?: boolean;
}

export function EditableTextField({
  initialValue,
  fieldKey,
  headingSize = '8',
  textFieldSize = '3',
  displayValue,
  onUpdate,
  isUpdating = false
}: EditableTextFieldProps) {
  const [editing, setEditing] = useState(false);  
  const displayText = displayValue || initialValue;


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const newValue = formData.get(fieldKey) as string;

    if (newValue.trim() && newValue !== initialValue) {
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
              type="text"
              defaultValue={initialValue}
              size={textFieldSize}
              disabled={isUpdating}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditing(false);
                }
              }}
              autoFocus
            />
            <Button type="submit" size="2" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update'}
            </Button>
            <Button
              type="button"
              size="2"
              variant="soft"
              onClick={() => setEditing(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
          </Flex>
        </form>
      </Flex>
    );
  }

  return (
    <Flex gap="2" align="center">
      <Heading size={headingSize}>{displayText}</Heading>
      <EditIconButton onClick={() => setEditing(true)} />
    </Flex>
  );
}