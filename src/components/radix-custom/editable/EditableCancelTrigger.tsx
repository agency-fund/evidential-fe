import { ReactNode } from 'react';
import { Button } from '@radix-ui/themes';
import { useEditable } from './EditableRoot';

interface EditableCancelTriggerProps {
  children?: ReactNode;
}

export function EditableCancelTrigger({ children }: EditableCancelTriggerProps) {
  const { cancel, isEditing } = useEditable();

  const handleClick = () => {
    cancel();
  };

  if (!isEditing) return null;

  return (
    <Button onClick={handleClick} type="button" variant="outline">
      {children || 'Cancel'}
    </Button>
  );
}