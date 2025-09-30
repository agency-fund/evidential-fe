'use client';
import { ReactNode, ReactElement, cloneElement, isValidElement } from 'react';
import { Text } from '@radix-ui/themes';
import { useEditable } from './EditableRoot';

interface EditablePreviewProps {
  asChild?: boolean;
  children?: ReactNode;
  displayValue?: string;
}

export function EditablePreview({ asChild = false, children, displayValue }: EditablePreviewProps) {
  const { inputValue, edit, isEditing } = useEditable();
  const valueToDisplay = displayValue ?? inputValue;

  const handleClick = () => {
    edit();
  };

  if (isEditing) return null;

  if (asChild && children && isValidElement(children)) {
    return cloneElement(children as ReactElement<any>, {
      onClick: handleClick,
      style: { cursor: 'pointer' },
      children: valueToDisplay,
    });
  }

  // Default fallback text component
  return (
    <Text onClick={handleClick} style={{ cursor: 'pointer' }}>
      {valueToDisplay}
    </Text>
  );
}