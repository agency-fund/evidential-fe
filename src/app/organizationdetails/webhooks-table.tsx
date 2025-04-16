'use client';
import { Table, Text, Flex, IconButton, Code } from '@radix-ui/themes';
import { WebhookSummary } from '@/api/methods.schemas';
import { TrashIcon, CopyIcon } from '@radix-ui/react-icons';
import { DeleteWebhookDialog } from './delete-webhook-dialog';

export function WebhooksTable({ 
  webhooks, 
  organizationId 
}: { 
  webhooks: WebhookSummary[]; 
  organizationId: string;
}) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>URL</Table.ColumnHeaderCell>
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
              <Table.Cell>
                <Flex align="center" gap="2">
                  <Code variant={'ghost'}>{webhook.id}</Code>
                  <IconButton size="1" aria-label="Copy value" color="gray" variant="ghost">
                    <CopyIcon onClick={() => navigator.clipboard.writeText(webhook.id)} />
                  </IconButton>
                </Flex>
              </Table.Cell>
              <Table.Cell>{webhook.type}</Table.Cell>
              <Table.Cell>{webhook.url}</Table.Cell>
              <Table.Cell>
                <Flex gap="2">
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
