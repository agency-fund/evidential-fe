'use client';

import { IconButton } from '@radix-ui/themes';
import { Cross2Icon } from '@radix-ui/react-icons';

export interface RemoveValueButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

export function RemoveValueButton({ onClick }: RemoveValueButtonProps) {
  return (
    <IconButton variant="soft" size="1" aria-label="Remove value" onClick={onClick}>
      <Cross2Icon />
    </IconButton>
  );
}
