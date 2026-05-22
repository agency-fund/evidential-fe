'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Tooltip } from '@radix-ui/themes';
import { CheckIcon, CopyIcon } from '@radix-ui/react-icons';

interface CopyToClipboardProps {
  content: string;
  tooltipContent?: string;
  size?: '1' | '2' | '3' | '4';
}

export function CopyToClipBoard({ content, tooltipContent = 'Copy to clipboard', size = '2' }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCopied(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <Tooltip content={tooltipContent}>
      <IconButton onClick={handleCopy} variant="ghost" size={size} color={copied ? 'green' : undefined}>
        <Box position="relative" width="18px" height="18px">
          <Box
            position="absolute"
            inset="0"
            style={{
              opacity: copied ? 0 : 1,
              transition: 'opacity 0.15s ease-in-out',
            }}
          >
            <CopyIcon width="18" height="18" />
          </Box>
          <Box
            position="absolute"
            inset="0"
            style={{
              opacity: copied ? 1 : 0,
              transition: 'opacity 0.15s ease-in-out',
            }}
          >
            <CheckIcon width="18" height="18" />
          </Box>
        </Box>
      </IconButton>
    </Tooltip>
  );
}
