'use client';
import { Table, Text, Flex, IconButton, Code } from '@radix-ui/themes';
import { WebhookSummary } from '@/api/methods.schemas';
import { TrashIcon, CopyIcon, EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons';
import { DeleteWebhookDialog } from './delete-webhook-dialog';
import { WebhookInfoDialog } from './webhook-info-dialog';
import { useState } from 'react';

export function WebhooksTable({ 
  webhooks, 
  organizationId 
}: { 
  webhooks: WebhookSummary[]; 
  organizationId: string;
}) {
  // Track which webhook auth tokens are visible
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});

  const toggleTokenVisibility = (webhookId: string) => {
    setVisibleTokens(prev => ({
      ...prev,
      [webhookId]: !prev[webhookId]
    }));
  };

  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Auth Key</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {webhooks.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={4}>
              <Text align="center">No webhooks found</Text>
            </Table.Cell>
          </Table.Row>
        ) : (
          webhooks.map((webhook) => (
            <Table.Row key={webhook.id}>
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
                        aria-label={visibleTokens[webhook.id] ? "Hide auth token" : "Show auth token"} 
                        color="gray" 
                        variant="ghost"
                        onClick={() => toggleTokenVisibility(webhook.id)}
                      >
                        {visibleTokens[webhook.id] ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      </IconButton>
                      <IconButton 
                        size="1" 
                        aria-label="Copy auth token" 
                        color="gray" 
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(webhook.auth_token || '')}
                      >
                        <CopyIcon />
                      </IconButton>
                    </>
                  )}
                </Flex>
              </Table.Cell>
              <Table.Cell>
                <Flex gap="2">
                  <WebhookInfoDialog webhook={webhook} />
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
