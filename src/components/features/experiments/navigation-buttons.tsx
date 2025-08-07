'use client';
import React from 'react';
import { Button, Flex } from '@radix-ui/themes';

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showBack?: boolean;
  className?: string;
}

export function NavigationButtons({
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  nextLoading = false,
  showBack = true,
  className,
}: NavigationButtonsProps) {
  return (
    <Flex
      gap="3"
      justify="between"
      align="center"
      className={className}
      style={{
        paddingTop: '24px',
        borderTop: '1px solid var(--gray-6)',
      }}
    >
      {showBack ? (
        <Button variant="soft" color="gray" onClick={onBack} disabled={!onBack}>
          Back
        </Button>
      ) : (
        <div />
      )}

      {onNext && (
        <Button onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
          {nextLabel}
        </Button>
      )}
    </Flex>
  );
}
