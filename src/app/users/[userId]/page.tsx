'use client';
import {
  Badge,
  Button,
  DataList,
  DropdownMenu,
  Flex,
  Heading,
  IconButton,
  Select,
  Text,
  Tooltip,
} from '@radix-ui/themes';
import { ArrowLeftIcon, DotsVerticalIcon, PlusIcon, QuestionMarkCircledIcon, TrashIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAddMemberToOrganization, useDeleteUser, useGetUser, useListOrganizations } from '@/api/admin';
import { ListOrganizationsScope, OrganizationListItem } from '@/api/methods.schemas';
import { useAuth } from '@/providers/auth-provider';
import { invalidatePath } from '@/services/swr-cache';
import { CopyToClipBoard } from '@/components/ui/buttons/copy-to-clipboard';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { XSpinner } from '@/components/ui/x-spinner';
import { SectionCard } from '@/components/ui/cards/section-card';
import { EmptyStateCard } from '@/components/ui/cards/empty-state-card';
import { DeleteAlertDialog } from '@/components/ui/delete-alert-dialog';
import { formatIsoDateTimeLocal } from '@/services/date-utils';
import { OrganizationsTable } from '@/components/features/organizations/organizations-table';
import { RemoveUserFromOrgDialog } from '@/components/features/users/remove-user-from-org-dialog';
import { UserPrivilegedToggle } from '@/components/features/users/user-privileged-toggle';

const UNIX_EPOCH_MS = new Date('1970-01-01T00:00:00Z').getTime();
const SELF_REMOVE_TOOLTIP = 'You cannot remove yourself from an organization.';

const hasLoggedOut = (iso: string): boolean => new Date(iso).getTime() > UNIX_EPOCH_MS;

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const auth = useAuth();

  const { data: user, isLoading, error } = useGetUser(userId, { swr: { enabled: !!userId } });

  const [orgToAdd, setOrgToAdd] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: orgsResponse } = useListOrganizations(
    { scope: ListOrganizationsScope.all, page_size: 100 },
    { swr: { enabled: !!user } },
  );

  const {
    trigger: deleteTrigger,
    isMutating: isDeleting,
    error: deleteError,
  } = useDeleteUser(userId, {
    swr: {
      revalidate: false,
      onSuccess: () => {
        router.replace('/users');
        void invalidatePath(['/v1/m/users', '/v1/m/organizations'], [`/v1/m/users/${userId}`]);
      },
    },
  });

  const {
    trigger: addMember,
    isMutating: addingOrg,
    error: addOrgError,
  } = useAddMemberToOrganization(orgToAdd, {
    swr: {
      onSuccess: async () => {
        setOrgToAdd('');
        await invalidatePath(['/v1/m/users', '/v1/m/organizations']);
      },
    },
  });

  if (!auth.isAuthenticated || !auth.isPrivileged) {
    return <Text>Access denied. Only privileged users can manage users.</Text>;
  }

  if (!userId) {
    return <Text>Error: Missing user ID.</Text>;
  }

  if (isLoading && !user) {
    return <XSpinner message="Loading user…" />;
  }

  if (error || !user) {
    return <GenericErrorCallout title="Failed to fetch user" error={error as Error | undefined} />;
  }

  const isSelf = auth.userEmail === user.email;
  const allOrgs = orgsResponse?.items ?? [];
  const memberOrgIds = new Set(user.organizations.map((o) => o.id));
  const availableOrgs = allOrgs.filter((o) => !memberOrgIds.has(o.id));

  const addToOrganization = async () => {
    if (!orgToAdd) return;
    try {
      await addMember({ email: user.email });
    } catch {
      // Surfaced via addOrgError from useAddMemberToOrganization.
    }
  };

  const renderOrgActions = (org: OrganizationListItem) => (
    <RemoveUserFromOrgDialog
      organizationId={org.id}
      organizationName={org.name}
      userId={user.id}
      userEmail={user.email}
      disabled={isSelf}
      disabledReason={isSelf ? SELF_REMOVE_TOOLTIP : undefined}
    />
  );

  return (
    <Flex direction="column" gap="6">
      <Flex direction="column" gap="2">
        <Link href="/users">
          <Flex align="center" gap="1">
            <ArrowLeftIcon />
            <Text size="2">Back to users</Text>
          </Flex>
        </Link>
        <Flex justify="between" align="end" wrap="wrap" gap="3">
          <Flex direction="row" align="center" gap="2" wrap="wrap">
            <Heading size="8">{user.email}</Heading>
            <CopyToClipBoard content={user.id} tooltipContent="Copy user ID" />
          </Flex>
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger>
              <IconButton variant="ghost" color="gray" size="2" aria-label="User actions">
                <DotsVerticalIcon width="18" height="18" />
              </IconButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" side="bottom">
              <DropdownMenu.Item color="red" disabled={isSelf} onSelect={() => setDeleteDialogOpen(true)}>
                <TrashIcon /> Delete user
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Flex>
      </Flex>

      <SectionCard title="Profile">
        <DataList.Root>
          <DataList.Item>
            <DataList.Label minWidth="120px">
              <Flex align="center" gap="1">
                Created
                <Tooltip content="When the user was created.">
                  <IconButton size="1" variant="ghost" color="gray" aria-label="What does Created mean?">
                    <QuestionMarkCircledIcon />
                  </IconButton>
                </Tooltip>
              </Flex>
            </DataList.Label>
            <DataList.Value>{formatIsoDateTimeLocal(user.created_at)}</DataList.Value>
          </DataList.Item>
          <DataList.Item align="center">
            <DataList.Label minWidth="120px">Has logged in</DataList.Label>
            <DataList.Value>
              <Badge color={user.has_logged_in ? 'green' : 'gray'} variant="soft">
                {user.has_logged_in ? 'Yes' : 'No'}
              </Badge>
            </DataList.Value>
          </DataList.Item>
          <DataList.Item>
            <DataList.Label minWidth="120px">
              <Flex align="center" gap="1">
                Last logout
                <Tooltip content="When the user most recently clicked logout.">
                  <IconButton size="1" variant="ghost" color="gray" aria-label="What does Last logout mean?">
                    <QuestionMarkCircledIcon />
                  </IconButton>
                </Tooltip>
              </Flex>
            </DataList.Label>
            <DataList.Value>
              {hasLoggedOut(user.last_logout) ? formatIsoDateTimeLocal(user.last_logout) : 'Never'}
            </DataList.Value>
          </DataList.Item>
          <DataList.Item align="center">
            <DataList.Label minWidth="120px">Privileged</DataList.Label>
            <DataList.Value>
              <UserPrivilegedToggle user={user} />
            </DataList.Value>
          </DataList.Item>
        </DataList.Root>
      </SectionCard>

      <SectionCard title="Organizations">
        <Flex direction="column" gap="3">
          {addOrgError && <GenericErrorCallout title="Failed to add user to organization" error={addOrgError} />}

          {user.organizations.length === 0 ? (
            <EmptyStateCard
              title="Not a member of any organization"
              description="Add this user to an organization below."
            />
          ) : (
            <OrganizationsTable organizations={user.organizations} renderActions={renderOrgActions} showJoinedAt />
          )}

          <Flex gap="2" align="center">
            <Select.Root
              value={orgToAdd}
              onValueChange={setOrgToAdd}
              disabled={addingOrg || availableOrgs.length === 0}
            >
              <Select.Trigger
                placeholder={availableOrgs.length === 0 ? 'No organizations available' : 'Add to organization…'}
              />
              <Select.Content position="popper">
                {availableOrgs.map((org) => (
                  <Select.Item key={org.id} value={org.id}>
                    <span title={org.id}>{org.name}</span>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Button onClick={addToOrganization} disabled={addingOrg || !orgToAdd} loading={addingOrg} variant="soft">
              <PlusIcon />
              Add
            </Button>
          </Flex>
        </Flex>
      </SectionCard>

      <DeleteAlertDialog
        title="Delete user"
        description={`Are you sure you want to delete ${user.email}?`}
        trigger={async () => {
          await deleteTrigger();
        }}
        loading={isDeleting}
        error={(deleteError as Error | undefined) ?? null}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        The user will lose access to the application and be removed from all of their organizations.
      </DeleteAlertDialog>
    </Flex>
  );
}
