import { ReactNode } from 'react';
import { IconButton } from '@radix-ui/themes';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { useEditable } from './EditableRoot';

interface EditableEditTriggerProps {
  children?: ReactNode;
}

export function EditableEditTrigger({ children }: EditableEditTriggerProps) {
  const { edit, isEditing } = useEditable();

  const handleClick = () => {
    edit();
  };

  if (isEditing) return null;

  return (
    <IconButton
      onClick={handleClick}
      variant="ghost"
      size="1"
      style={{ opacity: 0.6 }}
    >
      {children || <Pencil1Icon />}
    </IconButton>
  );
}