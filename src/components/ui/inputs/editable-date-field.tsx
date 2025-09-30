import { useState } from 'react';
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

interface EditableDateFieldProps {
  name: string;
  defaultValue: string;
  onSubmit: (value: string) => Promise<void> | void;
  size?: '1' | '2' | '3';
}

export function EditableDateField({
  name,
  defaultValue,
  onSubmit,
  size = '2',
}: EditableDateFieldProps) {
  const [error, setError] = useState<string>('');
  const [currentValue, setCurrentValue] = useState<string>(defaultValue);
  const displayDate = new Date(currentValue).toLocaleDateString();
  const dateInputValue = currentValue.split('T')[0];

  const handleSubmit = async (value: string) => {
    try {
      setError('');
      const isoValue = new Date(value + 'T00:00:00').toISOString();
      await onSubmit(isoValue);
      setCurrentValue(isoValue);
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
      <EditableRoot name={name} defaultValue={dateInputValue} onSubmit={handleSubmit}>
        <EditableArea>
          <Flex align="center" gap="2">
            <Flex align="start" gap="2">
              <EditablePreview displayValue={displayDate} />
              <EditableInput asChild>
                <TextField.Root
                  type="date"
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