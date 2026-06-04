'use client';
import { AlertDialog, Button, Flex, IconButton, Tooltip } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { useRemoveMemberFromOrganization } from '@/api/admin';
import { invalidatePath } from '@/services/swr-cache';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface RemoveUserFromOrgDialogProps {
  organizationId: string;
  organizationName: string;
  userId: string;
  userEmail: string;
  disabled?: boolean;
  disabledReason?: string;
}

export function RemoveUserFromOrgDialog({
  organizationId,
  organizationName,
  userId,
  userEmail,
  disabled,
  disabledReason,
}: RemoveUserFromOrgDialogProps) {
  const { trigger, isMutating, error } = useRemoveMemberFromOrganization(
    organizationId,
    userId,
    { allow_missing: true },
    {
      swr: {
        onSuccess: async () => await invalidatePath(['/v1/m/users', '/v1/m/organizations']),
      },
    },
  );

  const triggerButton = (
    <IconButton
      color="red"
      variant="soft"
      disabled={disabled || isMutating}
      aria-label={`Remove ${userEmail} from ${organizationName}`}
    >
      <TrashIcon />
    </IconButton>
  );

  if (disabled && disabledReason) {
    return <Tooltip content={disabledReason}>{triggerButton}</Tooltip>;
  }

  return (
    <AlertDialog.Root>
      <Tooltip content="Remove this user from this organization.">
        <AlertDialog.Trigger>{triggerButton}</AlertDialog.Trigger>
      </Tooltip>
      <AlertDialog.Content
        onKeyDown={async (e) => {
          if (e.key === 'Enter' && !isMutating) {
            e.preventDefault();
            await trigger();
          }
        }}
      >
        <AlertDialog.Title>Remove from organization</AlertDialog.Title>
        <AlertDialog.Description>
          Remove {userEmail} from {organizationName}? They will lose access to its datasources and experiments.
        </AlertDialog.Description>
        {error && <GenericErrorCallout title="Failed to remove user" error={error as Error} />}
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color="red"
              loading={isMutating}
              onClick={async (e) => {
                e.preventDefault();
                await trigger();
              }}
            >
              Remove
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
