import { ReactNode, ReactElement, cloneElement, isValidElement } from 'react';
import { Text } from '@radix-ui/themes';
import { useEditable } from './EditableRoot';

interface EditablePreviewProps {
  asChild?: boolean;
  children?: ReactNode;
}

export function EditablePreview({ asChild = false, children }: EditablePreviewProps) {
  const { inputValue, edit, isEditing } = useEditable();

  const handleClick = () => {
    edit();
  };

  if (isEditing) return null;

  if (asChild && children && isValidElement(children)) {
    return cloneElement(children as ReactElement<any>, {
      onClick: handleClick,
      style: { cursor: 'pointer' },
      children: inputValue,
    });
  }

  // Default fallback text component
  return (
    <Text onClick={handleClick} style={{ cursor: 'pointer' }}>
      {inputValue}
    </Text>
  );
}