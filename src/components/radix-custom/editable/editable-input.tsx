'use client';
import { ReactNode, ReactElement, cloneElement, isValidElement } from 'react';
import { useEditable } from '@/components/radix-custom/editable/editable-root';

interface EditableInputProps {
  asChild?: boolean;
  children?: ReactNode;
}

export function EditableInput({ asChild = false, children }: EditableInputProps) {
  const { inputValue, setValue, isEditing } = useEditable();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  if (!isEditing) return null;

  if (asChild && children && isValidElement(children)) {
    const childProps = (children as ReactElement<any>).props;
    return cloneElement(children as ReactElement<any>, {
      value: inputValue,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        handleChange(event);
        childProps.onChange?.(event);
      },
    });
  }

  // Default fallback input
  return <input value={inputValue} onChange={handleChange} />;
}
