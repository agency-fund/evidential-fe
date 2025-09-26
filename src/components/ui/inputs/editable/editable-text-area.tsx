'use client';

import { useState } from 'react';
import { Box, Flex, TextArea, Text } from '@radix-ui/themes';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { BaseEditableProps } from '@/components/ui/inputs/editable/types';
import { BUTTON_LAYOUTS } from '@/components/ui/inputs/editable/utils';
import { EditActionButtons } from '@/components/ui/inputs/editable/edit-action-buttons';

interface EditableTextAreaProps<T = Record<string, any>> extends BaseEditableProps<T> {
  readMore?: boolean;
}

export function EditableTextArea<T = Record<string, any>>({
  value,
  fieldKey,
  inputSize = '2',
  onUpdate,
  isUpdating = false,
  readMore = false,
  buttonPlacement = 'bottom-right',
}: EditableTextAreaProps<T>) {
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
      <Box width="100%">
        <form onSubmit={handleSubmit}>
          <Flex direction={layout.direction} gap="2" align={layout.align} width="100%">
            <Flex flexGrow={isRow ? '1' : undefined} width="100%" minWidth="0">
              <TextArea
                name={fieldKey as string}
                defaultValue={value}
                size={inputSize}
                disabled={isUpdating}
                autoFocus
                resize="vertical"
                style={{ width: '100%' }}
              />
            </Flex>
            <Flex gap="1" justify={layout.justify}>
              <EditActionButtons disabled={isUpdating} onCancel={() => setEditing(false)} />
            </Flex>
          </Flex>
        </form>
      </Box>
    );
  }

  return (
    <Flex gap="2" align="start" justify="between" width="100%">
      {readMore ? <ReadMoreText text={value} /> : <Text>{value}</Text>}
      <EditIconButton onClick={() => setEditing(true)} />
    </Flex>
  );
}
