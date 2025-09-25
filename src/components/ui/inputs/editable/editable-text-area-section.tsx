'use client';

import { useState } from 'react';
import { Flex, IconButton, TextArea, Tooltip } from '@radix-ui/themes';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { SectionCard } from '@/components/ui/cards/section-card';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';

interface EditableTextAreaSectionProps {
  title: string;
  initialValue: string;
  fieldKey: string;
  onUpdate: (formData: FormData) => Promise<void>;
  isUpdating?: boolean;
}

export function EditableTextAreaSection({
  title,
  initialValue,
  fieldKey,
  onUpdate,
  isUpdating = false
}: EditableTextAreaSectionProps) {
  const [editing, setEditing] = useState(false);

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

  return (
    <SectionCard
      title={title}
      headerRight={!editing ? <EditIconButton onClick={() => setEditing(true)} /> : null}
    >
      {editing ? (
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <TextArea
              name={fieldKey}
              defaultValue={initialValue}
              disabled={isUpdating}
              autoFocus
              resize="vertical"
              size="3"
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
      ) : (
        <ReadMoreText text={initialValue} />
      )}
    </SectionCard>
  );
}