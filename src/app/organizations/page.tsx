'use client';
import { Box, Flex, Heading, IconButton, Switch, Text, TextField, Tooltip } from '@radix-ui/themes';
import { MagnifyingGlassIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { XSpinner } from '@/components/ui/x-spinner';
import { useListOrganizations } from '@/api/admin';
import { ListOrganizationsScope } from '@/api/methods.schemas';
import { useAuth } from '@/providers/auth-provider';
import { useDebounced } from '@/providers/use-debounced';
import { usePagination } from '@/providers/use-pagination';
import { AddUserToOrgDialog } from '@/components/features/organizations/add-user-to-org-dialog';
import { CreateOrganizationDialog } from '@/components/features/organizations/create-organization-dialog';
import { OrganizationsTable } from '@/components/features/organizations/organizations-table';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { PaginationButtons } from '@/components/ui/pagination/pagination-buttons';

export default function Page() {
  const auth = useAuth();
  const canSeeAll = auth.isAuthenticated && auth.isPrivileged;
  const [scope, setScope] = useState<ListOrganizationsScope>(
    canSeeAll ? ListOrganizationsScope.all : ListOrganizationsScope.mine,
  );
  const [nameQuery, setNameQuery] = useState('');
  const debouncedNameQuery = useDebounced(nameQuery, 250);
  const pagination = usePagination({ resetKey: `${scope}:${debouncedNameQuery}` });

  const { data, isLoading, error } = useListOrganizations(
    {
      scope,
      page_size: pagination.pageSize,
      page_token: pagination.currentPageToken,
      name_contains: debouncedNameQuery || undefined,
      include_stats: true,
    },
    { swr: { keepPreviousData: true } },
  );

  const items = data?.items ?? [];
  const nextPageToken = data?.next_page_token || '';

  if (isLoading && data === undefined) {
    return <XSpinner message="Loading organizations..." />;
  }
  if (error) {
    return <GenericErrorCallout title="Failed to fetch organizations" error={error as Error} />;
  }

  return (
    <Flex direction="column" gap="3">
      <Flex justify="between" align="center">
        <Heading size="8">Manage Organizations</Heading>
        <CreateOrganizationDialog />
      </Flex>

      <Flex justify="between" align="center" gap="3">
        <Box minWidth="280px">
          <TextField.Root
            placeholder="Search by name…"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
          >
            <TextField.Slot>
              <MagnifyingGlassIcon />
            </TextField.Slot>
          </TextField.Root>
        </Box>
        {canSeeAll && (
          <Flex gap="2" align="center">
            <Text as="label" size="2">
              <Flex gap="2" align="center">
                <Switch
                  checked={scope === ListOrganizationsScope.all}
                  onCheckedChange={(checked) =>
                    setScope(checked ? ListOrganizationsScope.all : ListOrganizationsScope.mine)
                  }
                />
                Show all organizations
              </Flex>
            </Text>
            <Tooltip content="Include organizations you are not a member of.">
              <IconButton size="1" variant="ghost" color="gray" aria-label="What does Show all organizations do?">
                <QuestionMarkCircledIcon />
              </IconButton>
            </Tooltip>
          </Flex>
        )}
      </Flex>

      {items.length > 0 ? (
        <OrganizationsTable
          organizations={items}
          renderActions={(org) => <AddUserToOrgDialog organizationId={org.id} />}
        />
      ) : (
        <EmptyStateCard
          title="No organizations found"
          description={
            debouncedNameQuery ? 'No organizations match the current search.' : 'Create an organization to get started.'
          }
        >
          {!debouncedNameQuery && <CreateOrganizationDialog />}
        </EmptyStateCard>
      )}

      <Flex justify="end" gap="2">
        <PaginationButtons pagination={pagination} isLoading={isLoading} nextPageToken={nextPageToken} />
      </Flex>
    </Flex>
  );
}
