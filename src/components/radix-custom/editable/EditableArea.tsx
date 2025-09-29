import { ReactNode } from 'react';
import { Box } from '@radix-ui/themes';
import { useEditable } from './EditableRoot';

interface EditableAreaProps {
  children: ReactNode;
}

export function EditableArea({ children }: EditableAreaProps) {
  const { submit, cancel } = useEditable();

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      submit();
    } else if (event.key === 'Escape') {
      cancel();
    }
  };

  return (
    <Box onKeyDown={handleKeyDown}>
      {children}
    </Box>
  );
}