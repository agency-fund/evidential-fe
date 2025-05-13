'use client';
import { getGetOrganizationKey, useAddMemberToOrganization } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '../components/ui/x-spinner';
import { PlusIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';

export function AddUserDialog({ organizationId }: { organizationId: string }) {
  const { trigger, isMutating } = useAddMemberToOrganization(organizationId, {
    swr: { onSuccess: () => mutate(getGetOrganizationKey(organizationId)) },
  });
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>
          <PlusIcon />
          Add User
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Adding user..." />
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              const email = fd.get('email') as string;
              await trigger({
                email,
              });
              setOpen(false);
            }}
          >
            <Dialog.Title>Add Member</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Add a member to this organization.
            </Dialog.Description>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Email
                </Text>
                <TextField.Root
                  name="email"
                  type="email"
                  placeholder="Enter member email"
                  required
                  autoComplete={'off'}
                ></TextField.Root>
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit">Add Member</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
