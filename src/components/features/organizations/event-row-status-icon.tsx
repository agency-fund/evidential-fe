'use client';
import { Flex, Text, Tooltip } from '@radix-ui/themes';
import { CheckCircledIcon, CrossCircledIcon, InfoCircledIcon } from '@radix-ui/react-icons';
import { EventSummary, EventSummaryStatusIcon } from '@/api/methods.schemas';

const STATUS_CONFIG = {
  [EventSummaryStatusIcon.success]: { content: 'Success', color: 'green', Icon: CheckCircledIcon },
  [EventSummaryStatusIcon.failure]: { content: 'Failure', color: 'red', Icon: CrossCircledIcon },
  [EventSummaryStatusIcon.info]: { content: 'Info', color: 'gray', Icon: InfoCircledIcon },
} as const;

export function EventRowStatusIcon({ icon }: { icon: EventSummary['status_icon'] }) {
  const { content, color, Icon } = STATUS_CONFIG[icon ?? EventSummaryStatusIcon.info];
  return (
    <Tooltip content={content}>
      <Flex display="inline-flex" align="center" asChild>
        <Text color={color} as="span">
          <Icon />
        </Text>
      </Flex>
    </Tooltip>
  );
}
