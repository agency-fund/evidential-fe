'use client';

import { useState, useRef, useEffect } from 'react';
import { Text, Button, Flex } from '@radix-ui/themes';
import { MotionFlex } from '@/services/motion/motion-utils';

interface ReadMoreProps {
  text: string;
  maxWords?: number;
  togglePosition?: 'left' | 'right';
}

export function ReadMoreText({ text, maxWords = 30, togglePosition = 'left' }: ReadMoreProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [collapsedHeight, setCollapsedHeight] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);

  const words = text.split(/\s+/);
  const isTruncatable = words.length > maxWords;
  const truncated = words.slice(0, maxWords).join(' ') + '...';
  const displayText = showFullText || !isTruncatable ? text : truncated;

  useEffect(() => {
    if (textRef.current) {
      setCollapsedHeight(textRef.current.getBoundingClientRect().height);
    }
  }, []);

  const handleToggle = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setShowFullText(true);
      setIsExpanded(true);
    }
  };

  return (
    <Flex direction="column" gap="2">
      <MotionFlex
        direction="column"
        gap="2"
        animate={{ height: isExpanded ? 'auto' : collapsedHeight }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
        onAnimationComplete={() => {
          if (!isExpanded) {
            setShowFullText(false);
          }
        }}
      >
        <Text style={{ whiteSpace: 'pre-wrap' }} ref={textRef}>
          {displayText}
        </Text>
      </MotionFlex>

      {isTruncatable && (
        <Flex justify={togglePosition === 'left' ? 'start' : 'end'}>
          <Button size="1" variant="outline" onClick={handleToggle}>
            {isExpanded ? '– Show Less' : '+ Read More'}
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
