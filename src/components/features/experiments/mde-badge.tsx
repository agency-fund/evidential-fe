'use client';

import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Badge, Flex, Heading, Text, Tooltip as RadixTooltip } from '@radix-ui/themes';

type MdeBadgeProps = {
  value?: string | number | null;
  size?: '1' | '2' | '3';
};

export function MdeBadge({ value, size = '2' }: MdeBadgeProps) {
  const displayValue = value === null || value === undefined ? 'unknown' : String(value);
  return (
    <Badge size={size}>
      <Flex gap="4" align="center">
        <Heading size={size}>MDE:</Heading>
        <Flex gap="2" align="center">
          <Text>{displayValue}%</Text>
          <RadixTooltip content="This metric's minimum detectable effect as defined in the experiment's design that meets the confidence and power requirements.">
            <InfoCircledIcon />
          </RadixTooltip>
        </Flex>
      </Flex>
    </Badge>
  );
}

export default MdeBadge;
