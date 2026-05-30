'use client';
import { OrganizationListItem } from '@/api/methods.schemas';
import { Flex, IconButton, Table, Tooltip } from '@radix-ui/themes';
import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { ReactNode } from 'react';
import { formatIsoDateTimeLocal } from '@/services/date-utils';

interface OrganizationsTableProps {
  organizations: OrganizationListItem[];
  /** When provided, renders a trailing "Actions" column whose cells use this renderer. */
  renderActions?: (organization: OrganizationListItem) => ReactNode;
  /** When true, render a "Joined" column showing each item's joined_at. */
  showJoinedAt?: boolean;
}

export function OrganizationsTable({ organizations, renderActions, showJoinedAt = false }: OrganizationsTableProps) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>
            <Flex align="center" gap="1">
              Created
              <Tooltip content="When the organization was created.">
                <IconButton size="1" variant="ghost" color="gray" aria-label="What does Created mean?">
                  <QuestionMarkCircledIcon />
                </IconButton>
              </Tooltip>
            </Flex>
          </Table.ColumnHeaderCell>
          {showJoinedAt && (
            <Table.ColumnHeaderCell>
              <Flex align="center" gap="1">
                Joined
                <Tooltip content="When the user was added to this organization.">
                  <IconButton size="1" variant="ghost" color="gray" aria-label="What does Joined mean?">
                    <QuestionMarkCircledIcon />
                  </IconButton>
                </Tooltip>
              </Flex>
            </Table.ColumnHeaderCell>
          )}
          <Table.ColumnHeaderCell justify="end">Users</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell justify="end">Experiments</Table.ColumnHeaderCell>
          {renderActions && <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {organizations.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>
              <Link href={`/organizations/${item.id}`}>{item.name}</Link>
            </Table.Cell>
            <Table.Cell>{formatIsoDateTimeLocal(item.created_at)}</Table.Cell>
            {showJoinedAt && <Table.Cell>{item.joined_at ? formatIsoDateTimeLocal(item.joined_at) : '—'}</Table.Cell>}
            <Table.Cell justify="end">{item.user_count}</Table.Cell>
            <Table.Cell justify="end">{item.experiment_count}</Table.Cell>
            {renderActions && (
              <Table.Cell>
                <Flex gap="2">{renderActions(item)}</Flex>
              </Table.Cell>
            )}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
