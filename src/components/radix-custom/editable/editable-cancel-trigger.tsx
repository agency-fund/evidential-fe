'use client';
import { IconButton } from '@radix-ui/themes';
import { useEditable } from '@/components/radix-custom/editable/editable-root';
import { Cross2Icon } from '@radix-ui/react-icons';

interface EditableCancelTriggerProps {
  size?: '1' | '2' | '3';
}

export function EditableCancelTrigger({ size = '2' }: EditableCancelTriggerProps) {
  const { cancel, isEditing } = useEditable();


  if (!isEditing) return null;

  return (
    <IconButton onClick={cancel} type="button" variant="soft" color="red" size={size}>
      <Cross2Icon />
    </IconButton>
  );
}
