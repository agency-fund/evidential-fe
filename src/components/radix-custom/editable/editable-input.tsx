'use client';
import { ReactNode } from 'react';
import { useEditable } from '@/components/radix-custom/editable/editable-root';

type InputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

interface EditableInputRenderProps {
  value: string;
  onChange: (event: InputChangeEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

interface EditableInputProps {
  children: (props: EditableInputRenderProps) => ReactNode;
}

export function EditableInput({ children }: EditableInputProps) {
  const { inputValue, setInputValue, isEditing, submit, cancel } = useEditable();

  if (!isEditing) return null;

  return children({
    value: inputValue,
    onChange: (event: InputChangeEvent) => setInputValue(event.target.value),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        submit();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    },
  });
}
