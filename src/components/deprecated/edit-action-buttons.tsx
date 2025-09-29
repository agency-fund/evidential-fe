'use client';

import { IconButton, Tooltip } from '@radix-ui/themes';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { MotionFlex } from '@/services/motion/motion-utils';
import { transitions } from '@/services/motion/motion-tokens';

interface EditActionButtonsProps {
  disabled: boolean;
  onCancel: () => void;
  hasChanged?: boolean;
}

export function EditActionButtons({ disabled, onCancel, hasChanged = true }: EditActionButtonsProps) {
  const submitDisabled = disabled || !hasChanged;

  return (
    <MotionFlex
      gap="1"
      align="center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={transitions.normal}
    >
      <Tooltip content="Update">
        <IconButton type="submit" size="1" disabled={submitDisabled} color="green" variant="soft">
          <CheckIcon />
        </IconButton>
      </Tooltip>
      <Tooltip content="Cancel">
        <IconButton type="button" size="1" disabled={disabled} variant="soft" color="red" onClick={onCancel}>
          <Cross2Icon />
        </IconButton>
      </Tooltip>
    </MotionFlex>
  );
}
