'use client';
import { Box, Flex, Table, Text, TextField } from '@radix-ui/themes';
import { CheckIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useListUsers } from '@/api/admin';
import { ListUsersScope } from '@/api/methods.schemas';
import { useDebounced } from '@/providers/use-debounced';
import { usePagination } from '@/providers/use-pagination';
import { XSpinner } from '@/components/ui/x-spinner';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { PaginationButtons } from '@/components/ui/pagination/pagination-buttons';

const formatCreatedAt = (iso: string): string => new Date(iso).toLocaleDateString();

export function UsersManagementTable() {
  const [emailQuery, setEmailQuery] = useState('');
  const debouncedEmailQuery = useDebounced(emailQuery, 250);
  const { reset, ...pagination } = usePagination();

  useEffect(() => {
    reset();
  }, [debouncedEmailQuery, reset]);

  const { data, isLoading, error } = useListUsers(
    {
      page_size: pagination.pageSize,
      page_token: pagination.currentPageToken,
      email_contains: debouncedEmailQuery || undefined,
      scope: ListUsersScope.all,
    },
    { swr: { keepPreviousData: true } },
  );

  const users = data?.items ?? [];
  const nextPageToken = data?.next_page_token || '';

  if (isLoading && data === undefined) {
    return <XSpinner message="Loading users…" />;
  }
  if (error) {
    return <GenericErrorCallout title="Failed to fetch users" error={error as Error} />;
  }

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center" gap="3">
        <Box minWidth="280px">
          <TextField.Root
            placeholder="Search by email…"
            value={emailQuery}
            onChange={(e) => setEmailQuery(e.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
        </Box>
      </Flex>

      {users.length === 0 ? (
        <EmptyStateCard
          title="No users found"
          description={debouncedEmailQuery ? 'No users match the current search.' : 'There are no users in the system.'}
        />
      ) : (
        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="end">Organizations</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="center">Privileged</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell justify="center">Has logged in?</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {users.map((user) => (
              <Table.Row key={user.id}>
                <Table.Cell>
                  <Link href={`/users/${user.id}`}>{user.email}</Link>
                </Table.Cell>
                <Table.Cell>{formatCreatedAt(user.created_at)}</Table.Cell>
                <Table.Cell justify="end">{user.organizations.length}</Table.Cell>
                <Table.Cell justify="center">
                  {user.is_privileged ? <CheckIcon aria-label="Yes" /> : <Text color="gray">—</Text>}
                </Table.Cell>
                <Table.Cell justify="center">
                  {user.has_logged_in ? <CheckIcon aria-label="Yes" /> : <Text color="gray">—</Text>}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      )}

      <Flex justify="end" gap="2">
        <PaginationButtons pagination={pagination} isLoading={isLoading} nextPageToken={nextPageToken} />
      </Flex>
    </Flex>
  );
}
