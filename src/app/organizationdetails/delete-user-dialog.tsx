'use client';
import { AlertDialog, Button, Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { useRemoveMemberFromOrganization } from '@/api/admin';
import { mutate } from 'swr';

interface DeleteUserDialogProps {
  organizationId: string;
  userId: string;
}

export function DeleteUserDialog({ organizationId, userId }: DeleteUserDialogProps) {
  const { trigger } = useRemoveMemberFromOrganization(organizationId, userId);

  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <IconButton color="red" variant="soft">
          <TrashIcon />
        </IconButton>
      </AlertDialog.Trigger>
      <AlertDialog.Content>
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
                await mutate([`/v1/m/organizations/${organizationId}`]);
              }}
            >
              Remove
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};
