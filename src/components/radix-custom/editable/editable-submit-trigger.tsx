'use client';
import { IconButton } from '@radix-ui/themes';
import { useEditable } from '@/components/radix-custom/editable/editable-root';
import { CheckIcon } from '@radix-ui/react-icons';

interface EditableSubmitTriggerProps {
  size?: '1' | '2' | '3';
}

export function EditableSubmitTrigger({ size = '2' }: EditableSubmitTriggerProps) {
  const { submit, isEditing } = useEditable();

  const handleClick = () => {
    submit();
  };

  if (!isEditing) return null;

  return (
    <IconButton onClick={handleClick} type="button" variant="soft" color="green" size={size}>
      <CheckIcon />
    </IconButton>
  );
}
