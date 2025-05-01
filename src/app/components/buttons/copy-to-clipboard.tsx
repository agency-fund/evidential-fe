'use client';

import { useState, useRef, useEffect } from 'react';
import { Tooltip, IconButton } from '@radix-ui/themes';
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons';
import { MotionBox } from '@/app/lib/utils/motion/motion-utils';
import { transitions } from '@/app/lib/utils/motion/motion-tokens';

interface CopyToClipboardProps {
  content: string;
  tooltipContent?: string;
  size?: '1' | '2' | '3' | '4';
}

export function CopyToClipBoard({ content, tooltipContent = 'Copy to clipboard', size = '2' }: CopyToClipboardProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
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
        <MotionBox
          key={copied ? 'check' : 'copy'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transitions.fast}
          style={{ display: 'flex' }}
        >
          {copied ? <CheckIcon width="18" height="18" /> : <CopyIcon width="18" height="18" />}
        </MotionBox>
      </IconButton>
    </Tooltip>
  );
}
