'use client';
import { ReactNode } from 'react';
import { Box } from '@radix-ui/themes';

interface EditableAreaProps {
  children: ReactNode;
}

export function EditableArea({ children }: EditableAreaProps) {
  return <Box>{children}</Box>;
}
