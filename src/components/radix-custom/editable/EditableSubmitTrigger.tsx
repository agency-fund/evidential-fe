import { ReactNode } from 'react';
import { Button } from '@radix-ui/themes';
import { useEditable } from './EditableRoot';

interface EditableSubmitTriggerProps {
  children?: ReactNode;
}

export function EditableSubmitTrigger({ children }: EditableSubmitTriggerProps) {
  const { submit, isEditing } = useEditable();

  const handleClick = () => {
    submit();
  };

  if (!isEditing) return null;

  return (
    <Button onClick={handleClick} type="button">
      {children || 'Submit'}
    </Button>
  );
}