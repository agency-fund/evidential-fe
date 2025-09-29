import { ReactNode } from 'react';
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
  id: string;
  name: string;
  defaultValue?: string;
  onSubmit: (value: string) => Promise<void> | void;
  children: ReactNode;
  size?: '1' | '2' | '3';
  variant?: 'surface' | 'classic' | 'soft';
}

export function EditableTextField({
  id,
  name,
  defaultValue = '',
  onSubmit,
  children,
  size = '2',
  variant = 'surface',
}: EditableTextFieldProps) {
  return (
    <EditableRoot id={id} name={name} defaultValue={defaultValue} onSubmit={onSubmit}>
      <EditableArea>
        <Flex align="center" gap="2">
        <Flex align="start" gap="2">
          <EditablePreview asChild>{children}</EditablePreview>
          <EditableInput asChild>
            <TextField.Root size={size} variant={variant} autoFocus />
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
  );
}
