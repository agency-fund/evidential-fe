'use client';
import { IconButton } from '@radix-ui/themes';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { useEditable } from '@/components/radix-custom/editable/editable-root';

export function EditableEditTrigger() {
  const { edit, isEditing } = useEditable();

  if (isEditing) return null;

  return (
    <IconButton onClick={edit} variant="ghost" style={{ opacity: 0.6 }}>
      <Pencil1Icon />
    </IconButton>
  );
}
