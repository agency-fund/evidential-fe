'use client';
import { ReactNode } from 'react';
import { useEditable } from '@/components/radix-custom/editable/editable-root';

type InputChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

interface EditableInputRenderProps {
  value: string;
  onChange: (event: InputChangeEvent) => void;
}

interface EditableInputProps {
  children: (props: EditableInputRenderProps) => ReactNode;
}

export function EditableInput({ children }: EditableInputProps) {
  const { inputValue, setInputValue, isEditing } = useEditable();

  if (!isEditing) return null;

  return children({
    value: inputValue,
    onChange: (event: InputChangeEvent) => setInputValue(event.target.value),
  });
}
