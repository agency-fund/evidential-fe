import { ReactNode, useState } from 'react';
import { TextArea, Flex, Text } from '@radix-ui/themes';
import {
  EditableRoot,
  EditableArea,
  EditablePreview,
  EditableInput,
  EditableEditTrigger,
  EditableSubmitTrigger,
  EditableCancelTrigger,
} from '@/components/radix-custom/editable';

interface EditableTextAreaProps {
  name: string;
  defaultValue?: string;
  onSubmit: (value: string) => Promise<void> | void;
  children: ReactNode;
  size?: '1' | '2' | '3';
}

export function EditableTextArea({
  name,
  defaultValue = '',
  onSubmit,
  children,
  size = '2',
}: EditableTextAreaProps) {
  const [error, setError] = useState<string>('');

  const handleSubmit = async (value: string) => {
    try {
      setError('');
      await onSubmit(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    }
  };

  const handleChange = () => {
    if (error) setError('');
  };

  return (
    <Flex direction="column" gap="2">
      <EditableRoot name={name} defaultValue={defaultValue} onSubmit={handleSubmit}>
        <EditableArea>
          <Flex align="center" gap="2">
            <Flex align="start" gap="2">
              <EditablePreview asChild>{children}</EditablePreview>
              <EditableInput asChild>
                <TextArea
                  size={size}
                  variant={error ? 'soft' : 'surface'}
                  color={error ? 'red' : undefined}
                  autoFocus
                  onChange={handleChange}
                />
              </EditableInput>
              <EditableEditTrigger />
            </Flex>
            <Flex gap="1">
              <EditableSubmitTrigger size={size} />
              <EditableCancelTrigger size={size} />
            </Flex>
          </Flex>
        </EditableArea>
      </EditableRoot>
    </Flex>
  );
}