'use client';

import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Badge, Flex, Heading, Tooltip as RadixTooltip, Text } from '@radix-ui/themes';

type MdeBadgeProps = {
  value?: string | number | null;
  /**
   * Achievable MDE for the experiment's committed sample size, as a
   * percent string or number (e.g. "7.8" or 7.8 — without the "%"). When
   * provided AND meaningfully different from `value`, this renders next to
   * the Target MDE so reviewers can see what effect size the saved N is
   * actually powered to detect. Pass null/undefined for experiments where
   * achievable equals target by construction (e.g. user picked the
   * recommended sample size, or the experiment isn't preassigned).
   */
  achievable?: string | number | null;
  size?: '1' | '2' | '3';
};

function normaliseMdeValue(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export function MdeBadge({ value, achievable, size = '2' }: MdeBadgeProps) {
  const displayValue = value === null || value === undefined ? 'unknown' : String(value);

  // Only render the achievable column when (a) the caller supplied one and
  // (b) it differs from the target by more than a hair. The recommended-size
  // path produces achievable == target by construction, and showing
  // "Target: 10% | Achievable: 10%" would just be noise.
  const targetNum = normaliseMdeValue(value);
  const achievableNum = normaliseMdeValue(achievable);
  const showAchievable = achievableNum != null && (targetNum == null || Math.abs(achievableNum - targetNum) > 0.01);

  // When showing Achievable MDE, stack it BELOW Target MDE rather than
  // inline. The Summary page renders this badge in a narrow column next to
  // the metric name, and an inline Target | Achievable layout overflows and
  // causes the metric name to wrap one character per line.
  return (
    <Badge size={size}>
      <Flex direction="column" gap="1" align="start">
        <Flex gap="2" align="center">
          <Heading size={size}>Target MDE:</Heading>
          <Text>{displayValue}%</Text>
          <RadixTooltip content="The Target Minimum Detectable Effect — the effect size the experiment is designed to detect, given its confidence and power.">
            <InfoCircledIcon />
          </RadixTooltip>
        </Flex>
        {showAchievable && (
          // Blue is also the dominant accent for Target MDE elsewhere
          // (saved-experiment Analysis bar Badge), so coloring just the
          // Achievable text + heading blue keeps the two MDEs visually
          // linked while still distinguishing the achievable value from
          // the target one on the same badge.
          <Flex gap="2" align="center">
            <Heading size={size} color="blue">
              Achievable MDE:
            </Heading>
            <Text color="blue" weight="bold">
              {achievableNum.toFixed(2)}%
            </Text>
            <RadixTooltip content="The MDE the experiment is actually powered to detect at its committed sample size. Differs from Target MDE when the user picked a sample size other than the minimum required.">
              <InfoCircledIcon />
            </RadixTooltip>
          </Flex>
        )}
      </Flex>
    </Badge>
  );
}

export default MdeBadge;
