'use client';

import { useState } from 'react';
import { Box, Flex, IconButton, TextArea, Text, Tooltip } from '@radix-ui/themes';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { ReadMoreText } from '@/components/ui/read-more-text';

interface EditableTextAreaProps {
  initialValue: string;
  fieldKey: string;
  textAreaSize?: '1' | '2' | '3';
  displayValue?: string;
  onUpdate: (formData: FormData) => Promise<void>;
  isUpdating?: boolean;
  readMore?: boolean;
}

export function EditableTextArea({
  initialValue,
  fieldKey,
  textAreaSize = '2',
  displayValue,
  onUpdate,
  isUpdating = false,
  readMore = false,
}: EditableTextAreaProps) {
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
      <Box width="100%">
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <Flex direction="column" gap="2" style={{ width: '100%' }}>
            <TextArea
              name={fieldKey}
              defaultValue={initialValue}
              size={textAreaSize}
              disabled={isUpdating}
              autoFocus
              resize="vertical"
              style={{ width: '100%', minWidth: 0 }}
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
      </Box>
    );
  }

  return (
    <Flex gap="2" align="start" justify="between" width="100%">
      {readMore ? (
        <ReadMoreText text={displayText} />
      ) : (
        <Text>{displayText}</Text>
      )}
      <EditIconButton onClick={() => setEditing(true)} />
    </Flex>
  );
}