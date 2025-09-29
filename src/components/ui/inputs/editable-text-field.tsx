import { ReactNode, useState } from 'react';
import { TextField, Flex, Text } from '@radix-ui/themes';
import {
  EditableRoot,
  EditableArea,
  EditablePreview,
  EditableInput,
  EditableEditTrigger,
  EditableSubmitTrigger,
  EditableCancelTrigger,
} from '@/components/radix-custom/editable';

interface EditableTextFieldProps {
  name: string;
  defaultValue?: string;
  onSubmit: (value: string) => Promise<void> | void;
  children: ReactNode;
  size?: '1' | '2' | '3';
  variant?: 'surface' | 'classic' | 'soft';
}

export function EditableTextField({
  name,
  defaultValue = '',
  onSubmit,
  children,
  size = '2',
  variant = 'surface',
}: EditableTextFieldProps) {
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
                <TextField.Root
                  size={size}
                  variant={error ? 'soft' : variant}
                  color={error ? 'red' : undefined}
                  autoFocus
                  onChange={handleChange}
                />
              </EditableInput>
              <EditableEditTrigger />
            </Flex>
            <Flex gap="1">
              <EditableSubmitTrigger />
              <EditableCancelTrigger />
            </Flex>
          </Flex>
        </EditableArea>
      </EditableRoot>
      {error && (
        <Text size="1" color="red">
          {error}
        </Text>
      )}
    </Flex>
  );
}
