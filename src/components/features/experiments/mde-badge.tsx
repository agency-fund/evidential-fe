"use client";

import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
	Badge,
	Flex,
	Heading,
	Tooltip as RadixTooltip,
	Text,
} from "@radix-ui/themes";

type MdeBadgeProps = {
	value?: string | number | null;
	size?: "1" | "2" | "3";
};

export function MdeBadge({ value, size = "2" }: MdeBadgeProps) {
	const displayValue =
		value === null || value === undefined ? "unknown" : String(value);
	return (
		<Badge size={size}>
			<Flex gap="4" align="center">
				<Heading size={size}>Target MDE:</Heading>
				<Flex gap="2" align="center">
					<Text>{displayValue}%</Text>
					<RadixTooltip content="The Target Minimum Detectable Effect — the effect size the experiment is designed to detect, given its confidence and power.">
						<InfoCircledIcon />
					</RadixTooltip>
				</Flex>
			</Flex>
		</Badge>
	);
}

export default MdeBadge;
