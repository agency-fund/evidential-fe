'use client';

import { useState } from 'react';
import { Flex, Heading, IconButton, TextField, Tooltip } from '@radix-ui/themes';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
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
          <Flex direction="column" gap="2" align="start">
            <TextField.Root
              name={fieldKey}
              type="text"
              defaultValue={initialValue}
              size={textFieldSize}
              disabled={isUpdating}
              autoFocus
            />
            <Flex gap="2" justify="end">
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
          </Flex>
        </form>
      </Flex>
    );
  }

  return (
    <Flex gap="2" align="start" justify="between" width="100%">
      <Heading size={headingSize}>{displayText}</Heading>
      <EditIconButton onClick={() => setEditing(true)} />
    </Flex>
  );
}