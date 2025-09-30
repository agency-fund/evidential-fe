'use client';
import { ReactNode, ReactElement, cloneElement, isValidElement } from 'react';
import { Text } from '@radix-ui/themes';
import { useEditable } from '@/components/radix-custom/editable/editable-root';

interface EditablePreviewProps {
  asChild?: boolean;
  children?: ReactNode;
  displayValue?: string;
  editOnClick?: boolean;
}

export function EditablePreview({ asChild = false, children, displayValue, editOnClick = true }: EditablePreviewProps) {
  const { inputValue, edit, isEditing } = useEditable();
  const valueToDisplay = displayValue ?? inputValue;

  const handleClick = () => {
    if (editOnClick) {
      edit();
    }
  };

  if (isEditing) return null;

  if (asChild && children && isValidElement(children)) {
    return cloneElement(children as ReactElement<any>, {
      onClick: editOnClick ? handleClick : undefined,
      style: editOnClick ? { cursor: 'pointer' } : undefined,
      children: valueToDisplay,
    });
  }

  // Default fallback text component
  return (
    <Text onClick={editOnClick ? handleClick : undefined} style={editOnClick ? { cursor: 'pointer' } : undefined}>
      {children || valueToDisplay}
    </Text>
  );
}
