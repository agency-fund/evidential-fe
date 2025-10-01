import { ReactNode, useState } from 'react';
import { TextArea, Flex } from '@radix-ui/themes';
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
  value: string;
  onSubmit: (value: string) => Promise<void> | void;
  children: ReactNode;
  size?: '1' | '2' | '3';
}

export function EditableTextArea({ value, onSubmit, children, size = '2' }: EditableTextAreaProps) {
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

  const estimatedRows = Math.max(3, Math.min(Math.ceil(value.length / 80), 15));

  return (
    <Flex direction="column" gap="2">
      <EditableRoot value={value} onSubmit={handleSubmit}>
        <EditableArea>
          <Flex align="start" gap="2" direction="column" width="100%">
            <Flex align="start" gap="2" width="100%">
              <Flex style={{ flexGrow: 1 }}>
                <EditablePreview>{children}</EditablePreview>
                <EditableInput>
                  {({ value, onChange }) => (
                    <TextArea
                      value={value}
                      onChange={(e) => {
                        onChange(e);
                        handleChange();
                      }}
                      size={size}
                      variant={error ? 'soft' : 'surface'}
                      color={error ? 'red' : undefined}
                      autoFocus
                      resize="vertical"
                      rows={estimatedRows}
                      style={{ width: '100%' }}
                    />
                  )}
                </EditableInput>
              </Flex>
              <EditableEditTrigger />
            </Flex>
            <Flex gap="1" justify="end" width="100%">
              <EditableSubmitTrigger size={size} />
              <EditableCancelTrigger size={size} />
            </Flex>
          </Flex>
        </EditableArea>
      </EditableRoot>
    </Flex>
  );
}
