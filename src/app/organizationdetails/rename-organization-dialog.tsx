'use client';
import { getGetOrganizationKey, getListOrganizationsKey, useUpdateOrganization } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { Pencil2Icon } from '@radix-ui/react-icons';
import { mutate } from 'swr';

export function RenameOrganizationDialog({ organizationId, currentName }: { organizationId: string; currentName: string }) {
  const { trigger, isMutating } = useUpdateOrganization(organizationId);
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>
          <Pencil2Icon />
          Rename Organization
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Renaming organization..." />
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              const name = fd.get('name') as string;
              await trigger({
                name,
              });
              await mutate(getGetOrganizationKey(organizationId));
              await mutate(getListOrganizationsKey());
              setOpen(false);
            }}
          >
            <Dialog.Title>Rename Organization</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Change the organization name.
            </Dialog.Description>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Name
                </Text>
                <TextField.Root
                  name="name"
                  defaultValue={currentName}
                  placeholder="Enter organization name"
                  required
                ></TextField.Root>
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit">Rename</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
