'use client';

import { useState } from 'react';
import { Text, Button, Flex } from '@radix-ui/themes';

interface ReadMoreProps {
  text: string;
  maxWords?: number;
  togglePosition?: 'left' | 'right';
}

export function ReadMoreText({ text, maxWords = 30, togglePosition = 'left' }: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const words = text.split(/\s+/);
  const isTruncatable = words.length > maxWords;

  if (!isTruncatable) {
    return <Text style={{ whiteSpace: 'pre-wrap' }}>{text}</Text>;
  }

  const truncated = words.slice(0, maxWords).join(' ') + '...';

  return (
    <Flex direction="column" gap="2">
      <Text style={{ whiteSpace: 'pre-wrap' }}>{isExpanded ? text : truncated}</Text>
      <Flex justify={togglePosition === 'left' ? 'start' : 'end'}>
        <Button size="1" variant="outline" onClick={() => setIsExpanded((v) => !v)}>
          {isExpanded ? '– Show Less' : '+ Read More'}
        </Button>
      </Flex>
    </Flex>
  );
}
