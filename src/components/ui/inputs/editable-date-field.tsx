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
  value: string;
  onSubmit: (value: string) => Promise<void> | void;
  size?: '1' | '2' | '3';
}

export function EditableDateField({ name, value, onSubmit, size = '2' }: EditableDateFieldProps) {
  const [error, setError] = useState<boolean>();
  const displayDate = new Date(value).toLocaleDateString();
  const dateInputValue = value.split('T')[0];

  const handleSubmit = async (value: string) => {
    try {
      setError(false);
      const isoValue = new Date(value + 'T00:00:00').toISOString();
      await onSubmit(isoValue);
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
      <EditableRoot name={name} value={dateInputValue} onSubmit={handleSubmit}>
        <EditableArea>
          <Flex align="center" gap="2">
            <Flex align="center" gap="2">
              <EditablePreview displayValue={displayDate} />
              <EditableInput>
                {({ value, onChange }) => (
                  <TextField.Root
                    type="date"
                    value={value}
                    onChange={(e) => {
                      onChange(e);
                      handleChange();
                    }}
                    size={size}
                    variant={error ? 'soft' : 'surface'}
                    color={error ? 'red' : undefined}
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
