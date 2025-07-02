'use client';
import { Code, Flex, IconButton, Table, Text, Tooltip } from '@radix-ui/themes';
import { WebhookSummary } from '@/api/methods.schemas';
import { EyeClosedIcon, EyeOpenIcon } from '@radix-ui/react-icons';
import { DeleteWebhookDialog } from '@/components/features/organizations/delete-webhook-dialog';
import { WebhookInfoDialog } from '@/components/features/organizations/webhook-info-dialog';
import { EditWebhookDialog } from '@/components/features/organizations/edit-webhook-dialog';
import { RegenerateWebhookAuthDialog } from '@/components/features/organizations/regenerate-webhook-auth-dialog';
import { useState } from 'react';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';

export function WebhooksTable({ webhooks, organizationId }: { webhooks: WebhookSummary[]; organizationId: string }) {
  // Track which webhook auth tokens are visible
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});

  const toggleTokenVisibility = (webhookId: string) => {
    setVisibleTokens((prev) => ({
      ...prev,
      [webhookId]: !prev[webhookId],
    }));
  };

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Auth Key</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {webhooks.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={5}>
              <Text align="center">No webhooks found</Text>
            </Table.Cell>
          </Table.Row>
        ) : (
          webhooks.map((webhook) => (
            <Table.Row key={webhook.id}>
              <Table.Cell>{webhook.name}</Table.Cell>
              <Table.Cell>{webhook.type}</Table.Cell>
              <Table.Cell>{webhook.url}</Table.Cell>
              <Table.Cell>
                <Flex align="center" gap="2">
                  {webhook.auth_token && (
                    <>
                      <Code variant={'ghost'}>
                        {visibleTokens[webhook.id] ? webhook.auth_token : '••••••••••••••••'}
                      </Code>
                      <IconButton
                        size="1"
                        aria-label={visibleTokens[webhook.id] ? 'Hide auth token' : 'Show auth token'}
                        color="gray"
                        variant="ghost"
                        onClick={() => toggleTokenVisibility(webhook.id)}
                      >
                        <Tooltip content={visibleTokens[webhook.id] ? 'Hide auth token' : 'Show auth token'}>
                          {visibleTokens[webhook.id] ? <EyeOpenIcon /> : <EyeClosedIcon />}
                        </Tooltip>
                      </IconButton>
                      <CopyToClipBoard tooltipContent="Copy auth key" content={webhook.auth_token || ''} />
                    </>
                  )}
                </Flex>
              </Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <WebhookInfoDialog webhook={webhook} />
                  <EditWebhookDialog organizationId={organizationId} webhook={webhook} />
                  <RegenerateWebhookAuthDialog organizationId={organizationId} webhookId={webhook.id} />
                  <DeleteWebhookDialog organizationId={organizationId} webhookId={webhook.id} />
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}
