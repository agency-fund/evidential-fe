'use client';
import { useState } from 'react';
import { Button, Flex, Text, Tooltip } from '@radix-ui/themes';
import { CopyIcon, CheckIcon } from '@radix-ui/react-icons';

interface CopyToClipBoardProps {
  content: string;
  showText?: boolean;
  tooltipContent?: string;
  size?: '1' | '2' | '3' | '4';
}

export function CopyToClipBoard({
  content,
  showText = true,
  tooltipContent = 'Copy to clipboard',
  size = '1',
}: CopyToClipBoardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);

    // Reset after 3 seconds
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Flex align="center" gap="1">
      {copied && showText && (
        <Text size={size} color="green" style={{ marginRight: '4px' }}>
          Copied
        </Text>
      )}
      {copied ? (
        <CheckIcon style={{ color: 'green' }} />
      ) : (
        <Button variant="ghost" size={size} onClick={handleCopy}>
          <Tooltip content={tooltipContent}>
            <CopyIcon />
          </Tooltip>
        </Button>
      )}
    </Flex>
  );
}
