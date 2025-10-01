'use client';
import { ReactNode } from 'react';
import { Text } from '@radix-ui/themes';
import { useEditable } from '@/components/radix-custom/editable/editable-root';

interface EditablePreviewRenderProps {
  value: string;
}

interface EditablePreviewProps {
  children?: ReactNode | ((props: EditablePreviewRenderProps) => ReactNode);
  displayValue?: string;
}

export function EditablePreview({ children, displayValue }: EditablePreviewProps) {
  const { inputValue, isEditing } = useEditable();
  const valueToDisplay = displayValue ?? inputValue;

  if (isEditing) return null;

  if (typeof children === 'function') {
    return children({
      value: valueToDisplay,
    });
  }

  // Default fallback text component
  return <Text>{children || valueToDisplay}</Text>;
}
