import { ReactNode, useState } from 'react';
import { Select, Flex } from '@radix-ui/themes';
import {
  EditableRoot,
  EditableArea,
  EditablePreview,
  EditableInput,
  EditableEditTrigger,
  EditableSubmitTrigger,
  EditableCancelTrigger,
} from '@/components/radix-custom/editable';

interface EditableSelectProps {
  value: string;
  options: string[] | { label: string; value: string }[];
  onSubmit: (value: string) => Promise<void> | void;
  children: ReactNode;
  size?: '1' | '2' | '3';
  placeholder?: string;
}

export function EditableSelect({ value, options, onSubmit, children, size = '2', placeholder }: EditableSelectProps) {
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

  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { label: option.charAt(0).toUpperCase() + option.slice(1), value: option } : option
  );

  return (
    <EditableRoot value={value} onSubmit={handleSubmit}>
      <EditableArea>
        <Flex align="center" gap="2">
          <Flex align="center" gap="2">
            <EditablePreview>{children}</EditablePreview>
            <EditableInput>
              {({ value, onChange }) => (
                <Select.Root
                  value={value || undefined}
                  onValueChange={(newValue) => {
                    onChange({ target: { value: newValue } } as React.ChangeEvent<HTMLInputElement>);
                    clearError();
                  }}
                  size={size}
                >
                  <Select.Trigger
                    variant={error ? 'soft' : 'surface'}
                    color={error ? 'red' : undefined}
                    placeholder={placeholder}
                  />
                  <Select.Content position='popper'>
                    {normalizedOptions.map((option) => (
                      <Select.Item key={option.value} value={option.value}>
                        {option.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
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
  );
}
