'use client';
import { useState } from 'react';
import { Button, Tooltip, IconButton } from '@radix-ui/themes';
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons';

interface CopyToClipBoardProps {
  content: string;
  tooltipContent?: string;
  size?: '1' | '2' | '3' | '4';
}

export function CopyToClipBoard({ content, tooltipContent = 'Copy to clipboard', size = '2' }: CopyToClipBoardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);

    // Reset after 3 seconds
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <>
      {copied ? (
        <CheckIcon style={{ color: 'green' }} width="18" height="18" />
      ) : (
        <IconButton variant="ghost" size={size} onClick={handleCopy}>
          <Tooltip content={tooltipContent}>
            <CopyIcon width="18" height="18" />
          </Tooltip>
        </IconButton>
      )}
    </>
  );
}
