'use client';
import { Button, Code, Flex, Heading, IconButton, Table, Tooltip } from '@radix-ui/themes';
import { WebhookSummary } from '@/api/methods.schemas';
import { EyeClosedIcon, EyeOpenIcon, PlusIcon } from '@radix-ui/react-icons';
import { DeleteWebhookDialog } from '@/components/features/organizations/delete-webhook-dialog';
import { WebhookInfoDialog } from '@/components/features/organizations/webhook-info-dialog';
import { EditWebhookDialog } from '@/components/features/organizations/edit-webhook-dialog';
import { RegenerateWebhookAuthDialog } from '@/components/features/organizations/regenerate-webhook-auth-dialog';
import { useState } from 'react';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { AddWebhookDialog } from '@/components/features/organizations/add-webhook-dialog';

interface WebhooksTableProps {
  webhooks: WebhookSummary[];
  organizationId: string;
  isLoading: boolean;
  error?: Error;
  webhookCount: number;
  webhookLimit: number;
}

export function WebhooksTable({
  webhooks,
  organizationId,
  isLoading,
  error,
  webhookCount,
  webhookLimit,
}: WebhooksTableProps) {
  const [visibleTokens, setVisibleTokens] = useState<Record<string, boolean>>({});
  const [addWebhookDialogOpen, setAddWebhookDialogOpen] = useState(false);

  const isLimitReached = webhookCount >= webhookLimit;

  const toggleTokenVisibility = (webhookId: string) => {
    setVisibleTokens((prev) => ({
      ...prev,
      [webhookId]: !prev[webhookId],
    }));
  };

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading size="4">Webhooks</Heading>
        <Button disabled={isLimitReached} onClick={() => setAddWebhookDialogOpen(true)}>
          <PlusIcon />
          Add Webhook
        </Button>
      </Flex>

      <AddWebhookDialog
        organizationId={organizationId}
        open={addWebhookDialogOpen}
        onOpenChange={setAddWebhookDialogOpen}
      />

      {isLoading ? (
        <XSpinner message="Loading webhooks..." />
      ) : error ? (
        <GenericErrorCallout title="Failed to fetch webhooks" error={error} />
      ) : webhooks.length === 0 ? (
        <EmptyStateCard title="No webhooks found" description="Add a webhook to get started">
          <Button disabled={isLimitReached} onClick={() => setAddWebhookDialogOpen(true)}>
            <PlusIcon />
            Add Webhook
          </Button>
        </EmptyStateCard>
      ) : (
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
            {webhooks.map((webhook) => (
              <Table.Row key={webhook.id}>
                <Table.Cell>{webhook.name}</Table.Cell>
                <Table.Cell>{webhook.type}</Table.Cell>
                <Table.Cell>{webhook.url}</Table.Cell>
                <Table.Cell>
                  <Flex align="center" gap="2">
                    {webhook.auth_token && (
                      <>
                        <Code variant="ghost">
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
            ))}
          </Table.Body>
        </Table.Root>
      )}
    </Flex>
  );
}
