'use client';

import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Badge, Flex, Tooltip } from '@radix-ui/themes';
import type { ComponentProps } from 'react';

interface InfoBadgeProps {
  label: string;
  tooltip: string;
  color?: ComponentProps<typeof Badge>['color'];
  variant?: ComponentProps<typeof Badge>['variant'];
  size?: ComponentProps<typeof Badge>['size'];
}

export function InfoBadge({ label, tooltip, color, variant, size }: InfoBadgeProps) {
  return (
    <Badge color={color} variant={variant} size={size}>
      <Flex gap="1" align="center">
        {label}
        <Tooltip content={tooltip}>
          <InfoCircledIcon />
        </Tooltip>
      </Flex>
    </Badge>
  );
}
