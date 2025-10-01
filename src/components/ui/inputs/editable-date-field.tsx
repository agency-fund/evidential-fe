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
import { formatIsoDateLocal } from '@/services/date-utils';

interface EditableDateFieldProps {
  value: string;
  onSubmit: (value: string) => Promise<void> | void;
  size?: '1' | '2' | '3';
}

export function EditableDateField({ value, onSubmit, size = '2' }: EditableDateFieldProps) {
  const [error, setError] = useState<boolean>();

  // Extract date portion (YYYY-MM-DD) for the date input
  const dateInputValue = value.split('T')[0];

  // Format for display without timezone conversion
  const displayDate = formatIsoDateLocal(value);

  const handleSubmit = async (value: string) => {
    try {
      setError(false);
      // Create ISO string at midnight UTC to maintain the date
      const isoValue = new Date(value + 'T00:00:00.000Z').toISOString();
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
      <EditableRoot value={dateInputValue} onSubmit={handleSubmit}>
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
