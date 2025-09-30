import { ReactNode, useState } from 'react';
import { TextField, Flex } from '@radix-ui/themes';
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
}

export function EditableTextField({ name, defaultValue = '', onSubmit, children, size = '2' }: EditableTextFieldProps) {
  const [error, setError] = useState<boolean>();

  const handleSubmit = async (value: string) => {
    try {
      setError(false);
      await onSubmit(value);
    } catch (err) {
      setError(true);
      throw err;
    }
  };

  const handleChange = () => {
    if (error) setError(false);
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
