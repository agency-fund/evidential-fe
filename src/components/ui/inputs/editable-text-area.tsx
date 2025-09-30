import { useState } from 'react';
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
import { ReadMoreText } from '@/components/ui/read-more-text';

interface EditableTextAreaProps {
  name: string;
  defaultValue?: string;
  onSubmit: (value: string) => Promise<void> | void;
  size?: '1' | '2' | '3';
  readMore?: boolean;
  maxWords?: number;
}

export function EditableTextArea({
  name,
  defaultValue = '',
  onSubmit,
  size = '2',
  readMore = false,
  maxWords = 30,
}: EditableTextAreaProps) {
  const [error, setError] = useState<boolean>();
  const [currentValue, setCurrentValue] = useState<string>(defaultValue);

  const handleSubmit = async (value: string) => {
    try {
      setError(false);
      await onSubmit(value);
      setCurrentValue(value);
    } catch (err) {
      setError(true);
      throw err;
    }
  };

  const handleChange = () => {
    if (error) setError(false);
  };

  // Calculate rows based on string length (rough estimate: ~80 chars per line)
  const estimatedRows = Math.max(3, Math.min(Math.ceil(currentValue.length / 80), 15));

  return (
    <Flex direction="column" gap="2">
      <EditableRoot name={name} defaultValue={currentValue} onSubmit={handleSubmit}>
        <EditableArea>
          <Flex align="start" gap="2" direction="column" width="100%">
            <Flex align="start" gap="2" width="100%">
              <Flex style={{ flexGrow: 1 }}>
                <EditablePreview editOnClick={!readMore}>
                  {readMore ? <ReadMoreText text={currentValue} maxWords={maxWords} /> : <Text>{currentValue}</Text>}
                </EditablePreview>
                <EditableInput asChild>
                  <TextArea
                    size={size}
                    variant={error ? 'soft' : 'surface'}
                    color={error ? 'red' : undefined}
                    autoFocus
                    onChange={handleChange}
                    resize="vertical"
                    rows={estimatedRows}
                    style={{ width: '100%' }}
                  />
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
