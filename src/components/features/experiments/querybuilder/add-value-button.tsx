'use client';

import { Box, Button } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';

export interface AddValueButtonProps {
  onClick: (e: React.MouseEvent) => void;
  minWidth?: string;
}

export function AddValueButton({ onClick, minWidth }: AddValueButtonProps) {
  return (
    <Box py="1">
      <Button variant="soft" size="1" style={minWidth ? { minWidth } : undefined} onClick={onClick}>
        <PlusIcon /> Add value
      </Button>
    </Box>
  );
}
