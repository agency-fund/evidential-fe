'use client';
import { DataList, Flex, HoverCard, IconButton, Table, Tooltip } from '@radix-ui/themes';
import { EyeOpenIcon } from '@radix-ui/react-icons';
import { EventSummary } from '@/api/methods.schemas';
import Link from 'next/link';
import { CodeSnippetCard } from '@/components/ui/cards/code-snippet-card';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { ResendWebhookDialog } from '@/components/features/organizations/resend-webhook-dialog';
import { useState } from 'react';

const WEBHOOK_SENT_EVENT_TYPE = 'webhook.sent';

const EVENT_DETAILS = [
  {
    label: 'Event ID',
    value: (event: EventSummary) => event.id,
    copy: true,
  },
  {
    label: 'Timestamp',
    value: (event: EventSummary) => event.created_at,
    copy: false,
  },
  {
    label: 'Summary',
    value: (event: EventSummary) => event.summary,
    copy: false,
  },
] as const;

export function EventRow({ event, organizationId }: { event: EventSummary; organizationId: string }) {
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [isResendOpen, setIsResendOpen] = useState(false);

  return (
    <HoverCard.Root open={isHoverOpen && !isResendOpen} onOpenChange={setIsHoverOpen}>
      <HoverCard.Trigger>
        <Table.Row style={{ cursor: 'pointer' }}>
          <Table.Cell>{event.type}</Table.Cell>
          <Table.Cell>{new Date(event.created_at).toLocaleString()}</Table.Cell>
          <Table.Cell>{event.summary}</Table.Cell>
          <Table.Cell>
            <Flex gap="2">
              {event.link ? (
                <Tooltip content="View Experiment">
                  <Link href={event.link} target="_blank" rel="noopener noreferrer">
                    <IconButton variant="soft" color="green">
                      <EyeOpenIcon />
                    </IconButton>
                  </Link>
                </Tooltip>
              ) : null}
              {event.type === WEBHOOK_SENT_EVENT_TYPE ? (
                <ResendWebhookDialog
                  organizationId={organizationId}
                  eventId={event.id}
                  open={isResendOpen}
                  onOpenChange={setIsResendOpen}
                />
              ) : null}
            </Flex>
          </Table.Cell>
        </Table.Row>
      </HoverCard.Trigger>
      <HoverCard.Content>
        <DataList.Root>
          {EVENT_DETAILS.map((detail) => (
            <DataList.Item key={detail.label}>
              <DataList.Label>{detail.label}</DataList.Label>
              <DataList.Value>
                <Flex align="center" gap="2" justify="between" width="100%">
                  {detail.value(event)}
                  {detail.copy ? (
                    <CopyToClipBoard content={detail.value(event)} tooltipContent={`Copy ${detail.label}`} />
                  ) : null}
                </Flex>
              </DataList.Value>
            </DataList.Item>
          ))}
        </DataList.Root>

        {event.details ? (
          <CodeSnippetCard
            title="Details"
            content={JSON.stringify(event.details, undefined, 2)}
            tooltipContent="Copy details"
          />
        ) : null}
      </HoverCard.Content>
    </HoverCard.Root>
  );
}
