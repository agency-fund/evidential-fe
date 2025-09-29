import { ReactNode, ReactElement, cloneElement, isValidElement } from 'react';
import { useEditable } from './EditableRoot';

interface EditableInputProps {
  asChild?: boolean;
  children?: ReactNode;
}

export function EditableInput({ asChild = false, children }: EditableInputProps) {
  const { inputValue, setValue, submit, isEditing } = useEditable();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleBlur = () => {
    submit();
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
      onBlur: handleBlur,
    });
  }

  // Default fallback input
  return (
    <input
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  );
}