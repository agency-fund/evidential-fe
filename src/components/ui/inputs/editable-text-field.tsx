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
  value: string;
  onSubmit: (value: string) => Promise<void> | void;
  children: ReactNode;
  size?: '1' | '2' | '3';
  type?: 'text' | 'number';
  min?: number;
  max?: number;
  step?: number;
  /** Minimum width for the edit input (not the preview). */
  minWidth?: string;
}

export function EditableTextField({
  value,
  onSubmit,
  children,
  size = '2',
  type = 'text',
  min,
  max,
  step,
  minWidth,
}: EditableTextFieldProps) {
  const [error, setError] = useState<boolean>();

  const handleSubmit = async (value: string) => {
    try {
      setError(false);
      await onSubmit(value);
    } catch {
      setError(true);
    }
  };

  const clearError = () => {
    if (error) setError(false);
  };

  return (
    <Flex direction="column" gap="2">
      <EditableRoot value={value} onSubmit={handleSubmit}>
        <EditableArea>
          <Flex align="center" gap="2">
            <Flex align="center" gap="2">
              <EditablePreview>{children}</EditablePreview>
              <EditableInput>
                {({ value, onChange, onKeyDown }) => (
                  <TextField.Root
                    type={type}
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      clearError();
                    }}
                    onKeyDown={onKeyDown}
                    size={size}
                    variant={error ? 'soft' : 'surface'}
                    color={error ? 'red' : undefined}
                    style={minWidth ? { minWidth } : undefined}
                    autoFocus
                  />
                )}
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
