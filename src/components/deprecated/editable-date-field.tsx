'use client';

import { useState } from 'react';
import { Flex, Text, TextField } from '@radix-ui/themes';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { isoStringToDateInput, dateInputToIsoString } from '@/services/date-utils';
import { BaseEditableProps, EditStatus } from '@/components/ui/inputs/editable/types';
import { EditActionButtons } from '@/components/ui/inputs/editable/edit-action-buttons';

interface EditableDateFieldProps extends Omit<BaseEditableProps, 'value'> {
  isoValue: string;
}

export function EditableDateField({
  isoValue,
  fieldKey,
  inputSize = '1',
  onUpdate,
  isUpdating = false,
}: EditableDateFieldProps) {
  const [content, setContent] = useState(isoValue);
  const [status, setStatus] = useState<EditStatus>('idle');
  const [error, setError] = useState<string>('');
  const [hasChanged, setHasChanged] = useState(false);
  const displayText = new Date(content).toLocaleDateString();

  const isEditing = status === 'editing' || status === 'saving' || status === 'error';
  const isSaving = status === 'saving' || isUpdating;


  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const newValue = formData.get(fieldKey) as string;

    if (newValue && newValue !== isoStringToDateInput(content)) {
      const processedValue = dateInputToIsoString(newValue);
      formData.set(fieldKey, processedValue);

      try {
        setStatus('saving');
        setError('');
        await onUpdate(formData);
        setHasChanged(false);
        setStatus('success');
        setContent(processedValue);

        // Delay exiting edit mode to show success feedback
        setTimeout(() => {
          setStatus('idle');
        }, 1500);
      } catch (err) {
        console.error('Update failed:', err);
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
                type="date"
                defaultValue={isoStringToDateInput(content)}
                size={inputSize}
                disabled={isSaving}
                autoFocus
                color={error ? 'red' : undefined}
                onChange={() => {
                  setHasChanged(true);
                  if (error) setError('');
                }}
              />
            </Flex>
            <Flex gap="1" justify="end">
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
    <Flex gap="2" align="center">
      <Text>{displayText}</Text>
      <EditIconButton onClick={() => setStatus('editing')} />
    </Flex>
  );
}
