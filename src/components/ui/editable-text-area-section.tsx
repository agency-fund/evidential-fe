'use client';

import { useState } from 'react';
import { Button, Flex, TextArea } from '@radix-ui/themes';
import { SectionCard } from '@/components/ui/cards/section-card';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';

interface EditableTextAreaSectionProps {
  title: string;
  initialValue: string;
  fieldKey: string;
  onUpdate: (formData: FormData) => Promise<void>;
  isUpdating?: boolean;
  updateError?: Error;
}

export function EditableTextAreaSection({
  title,
  initialValue,
  fieldKey,
  onUpdate,
  isUpdating = false,
  updateError
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
      headerRight={<EditIconButton onClick={() => setEditing(true)} />}
    >
      {editing ? (
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {updateError && (
              <GenericErrorCallout
                title="Update failed"
                error={updateError}
              />
            )}
            <TextArea
              name={fieldKey}
              defaultValue={initialValue}
              disabled={isUpdating}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditing(false);
                }
              }}
              autoFocus
            />
            <Flex gap="2" justify="end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Update'}
              </Button>
              <Button
                type="button"
                variant="soft"
                onClick={() => setEditing(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
            </Flex>
          </Flex>
        </form>
      ) : (
        <ReadMoreText text={initialValue} />
      )}
    </SectionCard>
  );
}