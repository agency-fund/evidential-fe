'use client';
import { IconButton } from '@radix-ui/themes';
import { useEditable } from './EditableRoot';
import { Cross1Icon } from '@radix-ui/react-icons';


interface EditableCancelTriggerProps {
  size?: '1' | '2' | '3';
}

export function EditableCancelTrigger({size = '2'}: EditableCancelTriggerProps) {
  const { cancel, isEditing } = useEditable();

  const handleClick = () => {
    cancel();
  };

  if (!isEditing) return null;

  return (
    <IconButton onClick={handleClick} type="button" variant="soft" color="red" size={size}>
      <Cross1Icon/>
    </IconButton>
  );
}