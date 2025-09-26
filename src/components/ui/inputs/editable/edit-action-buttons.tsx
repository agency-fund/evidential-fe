'use client';

import { IconButton, Tooltip } from '@radix-ui/themes';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

interface EditActionButtonsProps {
  disabled: boolean;
  onCancel: () => void;
}

export function EditActionButtons({ disabled, onCancel }: EditActionButtonsProps) {
  return (
    <>
      <Tooltip content="Update">
        <IconButton type="submit" size="1" disabled={disabled} color="green" variant="soft">
          <CheckIcon />
        </IconButton>
      </Tooltip>
      <Tooltip content="Cancel">
        <IconButton type="button" size="1" variant="soft" color="red" onClick={onCancel} disabled={disabled}>
          <Cross2Icon />
        </IconButton>
      </Tooltip>
    </>
  );
}