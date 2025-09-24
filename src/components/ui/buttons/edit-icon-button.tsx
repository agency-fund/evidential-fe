'use client';

import { IconButton, Tooltip } from '@radix-ui/themes';
import { Pencil1Icon } from '@radix-ui/react-icons';

interface EditIconButtonProps {
  onClick: () => void;
  size?: '1' | '2' | '3';
  tooltipContent?: string;
  disabled?: boolean;
}

export function EditIconButton({
  onClick,
  size = '1',
  tooltipContent = 'Edit',
  disabled = false
}: EditButtonProps) {
  return (
    <Tooltip content={tooltipContent}>
      <IconButton
        size={size}
        variant="ghost"
        onClick={onClick}
        disabled={disabled}
      >
        <Pencil1Icon />
      </IconButton>
    </Tooltip>
  );
}