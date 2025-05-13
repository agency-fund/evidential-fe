'use client';
import { useCreateOrganizations } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { PlusIcon } from '@radix-ui/react-icons';

export function CreateOrganizationDialog() {
  const { trigger, isMutating } = useCreateOrganizations();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Flex gap="3">
          <Button>
            <PlusIcon /> Create Organization
          </Button>
        </Flex>
      </Dialog.Trigger>

      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Creating organization..." />
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              const name = fd.get('name') as string;
              await trigger({ name });
              setOpen(false);
            }}
          >
            <Dialog.Title>Create Organization</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Create a new organization.
            </Dialog.Description>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Name
                </Text>
                <TextField.Root name="name" placeholder="Enter organization name" required></TextField.Root>
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit">Create</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
