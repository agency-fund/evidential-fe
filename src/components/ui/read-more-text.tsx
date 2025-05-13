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

  const isTruncatable = text.split(/\s+/).length > maxWords;
  const textToDisplay = isExpanded || !isTruncatable ? text : `${text.split(/\s+/).slice(0, maxWords).join(' ')}...`;

  return (
    <Flex direction="column" gap="2">
      <Text style={{ whiteSpace: 'pre-wrap' }}>{textToDisplay}</Text>
      {isTruncatable && (
        <Flex justify={togglePosition === 'left' ? 'start' : 'end'}>
          <Button size="1" variant="outline" onClick={() => setIsExpanded((prev) => !prev)}>
            {isExpanded ? '- Show Less' : '+ Read More'}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
