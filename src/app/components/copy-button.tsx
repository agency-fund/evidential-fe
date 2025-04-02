'use client';

import { Button } from '@radix-ui/themes';
import { CodeIcon } from '@radix-ui/react-icons';
import * as Toast from '@radix-ui/react-toast';
import { useState } from 'react';

interface CopyButtonProps {
  value: string;
  label?: string;
}

export function CopyButton({ value, label = 'ID' }: CopyButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="1"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setOpen(true);
        }}
      >
        <CodeIcon />
      </Button>

      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        duration={2000}
        style={{
          background: 'white',
          padding: '12px 16px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Toast.Title style={{ margin: 0 }}>Copied {label} to clipboard</Toast.Title>
      </Toast.Root>
    </>
  );
}
