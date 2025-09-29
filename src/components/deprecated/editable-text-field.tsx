'use client';

import { useState, ReactNode } from 'react';
import { Flex, TextField, Text } from '@radix-ui/themes';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { BaseEditableProps, EditStatus } from '@/components/ui/inputs/editable/types';
import { EditActionButtons } from '@/components/ui/inputs/editable/edit-action-buttons';

interface EditableTextFieldProps extends BaseEditableProps {
  children: (content: string) => ReactNode;
}

export function EditableTextField({
  value,
  fieldKey,
  inputSize = '3',
  onUpdate,
  isUpdating = false,
  children,
}: EditableTextFieldProps) {
  const [content, setContent] = useState(value);
  const [status, setStatus] = useState<EditStatus>('idle');
  const [error, setError] = useState<string>('');
  const [hasChanged, setHasChanged] = useState(false);

  const isEditing = status === 'editing' || status === 'saving' || status === 'error';
  const isSaving = status === 'saving' || isUpdating;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const newValue = formData.get(fieldKey) as string;

    if (newValue.trim() && newValue !== value) {
      try {
        setStatus('saving');
        setError('');
        await onUpdate(formData);
        setHasChanged(false);
        setStatus('success');
        setContent(newValue);

        // Delay exiting edit mode to show success feedback
        setTimeout(() => {
          setStatus('idle');
        }, 1500);
      } catch (err) {
        console.log('Update failed:', err);
        setError(err instanceof Error ? err.message : 'Update failed');
        setStatus('error');
      }
    } else {
      setStatus('idle');
      setHasChanged(false);
    }
  };

  if (isEditing) {
    return (
      <Flex direction="column" gap="2">
        <form onSubmit={handleSubmit}>
          <Flex direction="row" gap="2" align="center">
            <Flex flexGrow="1">
              <TextField.Root
                name={fieldKey}
                type="text"
                defaultValue={content}
                size={inputSize}
                disabled={isSaving}
                autoFocus
                color={error ? 'red' : undefined}
                variant={error ? 'soft' : 'surface'}
                onChange={() => {
                  setHasChanged(true);
                  if (error) setError('');
                }}
                style={{ width: '100%' }}
              />
            </Flex>
            <Flex justify="end">
              <EditActionButtons
                disabled={isSaving}
                hasChanged={hasChanged}
                onCancel={() => {
                  setStatus('idle');
                  setError('');
                  setHasChanged(false);
                }}
              />
            </Flex>
          </Flex>
        </form>
        {error && (
          <Text size="1" color="red">
            {error}
          </Text>
        )}
      </Flex>
    );
  }

  return (
    <Flex gap="2" align="start" justify="between" width="100%">
      {children(content)}
      <EditIconButton onClick={() => setStatus('editing')} />
    </Flex>
  );
}
