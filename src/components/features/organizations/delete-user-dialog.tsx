'use client';
import { AlertDialog, Button, Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { getGetOrganizationKey, useRemoveMemberFromOrganization } from '@/api/admin';
import { mutate } from 'swr';

interface DeleteUserDialogProps {
  organizationId: string;
  userId: string;
}

export function DeleteUserDialog({ organizationId, userId }: DeleteUserDialogProps) {
  const { trigger } = useRemoveMemberFromOrganization(
    organizationId,
    userId,
    { allow_missing: true },
    {
      swr: { onSuccess: () => mutate(getGetOrganizationKey(organizationId)) },
    },
  );

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content
        onKeyDown={async (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            await trigger();
          }
        }}
      >
        <AlertDialog.Title>Remove User</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to remove this user from the organization? This action cannot be undone.
        </AlertDialog.Description>
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
              onClick={async () => {
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
