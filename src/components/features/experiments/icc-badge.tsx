'use client';

/**
 * IccBadge displays the Intraclass Correlation Coefficient (ICC) for a
 * cluster-randomized experiment alongside Target MDE in the analysis bar.
 * Issue #217 mockup ClustersUI6A/6B.
 */

import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Badge, Flex, Heading, Tooltip as RadixTooltip, Text } from '@radix-ui/themes';

type IccBadgeProps = {
  value?: number | null;
  size?: '1' | '2' | '3';
};

const ICC_TOOLTIP =
  'Intraclass Correlation Coefficient: measures how similar participants within the same cluster are. Higher values reduce statistical power.';

export function IccBadge({ value, size = '2' }: IccBadgeProps) {
  if (value === null || value === undefined) return null;
  const display = typeof value === 'number' ? value.toFixed(3) : String(value);
  return (
    <Badge size={size}>
      <Flex gap="4" align="center">
        <Heading size={size}>ICC:</Heading>
        <Flex gap="2" align="center">
          <Text>{display}</Text>
          <RadixTooltip content={ICC_TOOLTIP}>
            <InfoCircledIcon />
          </RadixTooltip>
        </Flex>
      </Flex>
    </Badge>
  );
}

export default IccBadge;
