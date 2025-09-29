'use client';

import { useState } from 'react';
import { Box, Flex, TextArea, Text } from '@radix-ui/themes';
import { EditIconButton } from '@/components/ui/buttons/edit-icon-button';
import { ReadMoreText } from '@/components/ui/read-more-text';
import { BaseEditableProps, EditStatus } from '@/components/ui/inputs/editable/types';
import { EditActionButtons } from '@/components/ui/inputs/editable/edit-action-buttons';

interface EditableTextAreaProps extends BaseEditableProps {
  readMore?: boolean;
}

const calculateRows = (content: string) => {
  if (!content || content.length < 100) return 3;
  if (content.length < 300) return 5;
  if (content.length < 500) return 7;
  return 10;
};

export function EditableTextArea({
  value,
  fieldKey,
  inputSize = '2',
  onUpdate,
  isUpdating = false,
  readMore = false,
}: EditableTextAreaProps) {
  const [content, setContent] = useState(value);
  const [status, setStatus] = useState<EditStatus>('idle');
  const [error, setError] = useState<string>('');
  const [hasChanged, setHasChanged] = useState<boolean>(false);

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
      <Box width="100%">
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="2" align="end" width="100%">
            <Flex width="100%" minWidth="0">
              <TextArea
                name={fieldKey}
                defaultValue={value}
                size={inputSize}
                disabled={isSaving}
                autoFocus
                resize="vertical"
                variant={error ? 'soft' : 'surface'}
                color={error ? 'red' : undefined}
                onChange={() => {
                  setHasChanged(true);
                  if (error) setError('');
                }}
                style={{ width: '100%'}}
                rows={calculateRows(value)}
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
      </Box>
    );
  }

  return (
    <Flex gap="2" align="start" justify="between" width="100%">
      {readMore ? <ReadMoreText text={content} /> : <Text>{content}</Text>}
      <EditIconButton onClick={() => setStatus('editing')} />
    </Flex>
  );
}
