'use client';
import React from 'react';
import { Button, Flex, Tooltip } from '@radix-ui/themes';

interface NavigationButtonsProps {
  // The text to render on the prev button.
  prevLabel?: string;

  // The text to render on the next button.
  nextLabel?: string;

  // The text to render on the skip button.
  skipLabel?: string;

  // If true, the "prev" button will be rendered in a disabled state.
  prevDisabled?: boolean;

  // If true, the "next" button will be rendered in a disabled state.
  nextDisabled?: boolean;

  // If true, the "next" button text will be replaced with a spinner.
  nextLoading?: boolean;

  // Handler for the "prev" button. If undefined, the prev button will not be rendered.
  onPrev?: () => void;

  // Handler for the "next" button. If undefined, the next button will not be rendered.
  onNext?: () => void;

  // Handler for an optional "Skip" button, rendered to the left of Back/Next. If undefined, no skip
  // button is shown.
  onSkip?: () => void;

  // Tooltip to display over the "next" button when nextDisabled is true.
  nextTooltipContent?: string;
}

export function NavigationButtons({
  onPrev,
  onNext,
  nextLabel = 'Next',
  prevLabel = 'Back',
  nextDisabled = false,
  nextLoading = false,
  prevDisabled = false,
  nextTooltipContent,
  onSkip,
  skipLabel = 'Skip',
}: NavigationButtonsProps) {
  let nextButton = (
    <Button onClick={onNext} disabled={!onNext || nextDisabled} loading={nextLoading}>
      {nextLabel}
    </Button>
  );
  if (nextTooltipContent !== undefined) {
    nextButton = (
      <Tooltip content={nextTooltipContent} side="top" align="center">
        {nextButton}
      </Tooltip>
    );
  }
  const prevButton = (
    <Button onClick={onPrev} disabled={!onPrev || prevDisabled} variant="soft" color="gray">
      {prevLabel}
    </Button>
  );
  const skipButton = (
    <Button onClick={onSkip} variant="soft" color="gray">
      {skipLabel}
    </Button>
  );
  return (
    <Flex gap="3" justify="end" align="center" mt="6">
      {onSkip ? skipButton : null}
      {onPrev ? prevButton : <div />}
      {onNext ? nextButton : <div />}
    </Flex>
  );
}
