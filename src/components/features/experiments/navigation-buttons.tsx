'use client';
import React from 'react';
import { Button, Flex, Tooltip } from '@radix-ui/themes';

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showBack?: boolean;
  className?: string;
  tooltipMessage?: string;
}

export function NavigationButtons({
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  nextLoading = false,
  showBack = true,
  className,
  tooltipMessage = 'Please complete all required fields before proceeding.',
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
          Back
        </Button>
      ) : (
        <div />
      )}

      {onNext && nextDisabled ? (
        <Tooltip content={tooltipMessage} side="top" align="center">
          {nextButton}
        </Tooltip>
      ) : (
        onNext && nextButton
      )}
    </Flex>
  );
}
