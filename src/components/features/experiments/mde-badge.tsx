'use client';

import { ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { Badge, Flex, Heading, Text, Tooltip as RadixTooltip } from '@radix-ui/themes';

type MdeKind = 'target' | 'estimated';

type MdeBadgeProps = {
  value?: string | number | null;
  size?: '1' | '2' | '3';
  kind?: MdeKind;
  hasMissingValues?: boolean;
};

const MDE_COPY: Record<MdeKind, { label: string; tooltip: string }> = {
  target: {
    label: 'Target MDE:',
    tooltip:
      'The minimum effect size you set as your detection goal for this metric. It should be the smallest change you considered worth acting on.',
  },
  estimated: {
    label: 'Estimated MDE:',
    tooltip:
      "The smallest effect this experiment can reliably detect given its sample size, at the design's confidence and power requirements.",
  },
};

const MISSING_VALUES_NOTE =
  "Some participants are missing values for this metric. This MDE assumes they will be filled in during the experiment; otherwise the experiment can only reliably detect effects larger than what's shown.";

export function MdeBadge({ value, size = '2', kind = 'target', hasMissingValues = false }: MdeBadgeProps) {
  const displayValue = value === null || value === undefined ? 'unknown' : String(value);
  const { label, tooltip } = MDE_COPY[kind];
  return (
    <Badge size={size}>
      <Flex gap="4" align="center">
        <Heading size={size}>{label}</Heading>
        <Flex gap="2" align="center">
          <Text>{displayValue}%</Text>
          <RadixTooltip content={tooltip}>
            <InfoCircledIcon />
          </RadixTooltip>
          {hasMissingValues ? (
            <RadixTooltip content={MISSING_VALUES_NOTE}>
              <ExclamationTriangleIcon color="var(--amber-11)" />
            </RadixTooltip>
          ) : null}
        </Flex>
      </Flex>
    </Badge>
  );
}

export default MdeBadge;
