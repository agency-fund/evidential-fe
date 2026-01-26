'use client';
import React from 'react';
import { Button, Flex, Tooltip } from '@radix-ui/themes';

interface NavigationButtonsProps {
  backLabel?: string;
  className?: string;
  nextDisabled?: boolean;
  nextLabel?: string;
  nextLoading?: boolean;
  nextTooltipContent?: string;
  onBack?: () => void;
  onNext?: () => void;
  prevTooltipContent?: string;
  showBack?: boolean;
}

export function NavigationButtons({
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  nextDisabled = false,
  nextLoading = false,
  showBack = true,
  className,
  nextTooltipContent,
}: NavigationButtonsProps) {
  const nextButton = (
    <Button onClick={onNext} disabled={nextDisabled} loading={nextLoading}>
      {nextLabel}
    </Button>
  );
  return (
    <Flex gap="3" justify="end" align="center" className={className} mt="6">
      {showBack ? (
        <Button variant="soft" color="gray" onClick={onBack} disabled={!onBack}>
          {backLabel}
        </Button>
      ) : (
        <div />
      )}

      {onNext && nextDisabled ? (
        <Tooltip content={nextTooltipContent} side="top" align="center">
          {nextButton}
        </Tooltip>
      ) : (
        onNext && nextButton
      )}
    </Flex>
  );
}
