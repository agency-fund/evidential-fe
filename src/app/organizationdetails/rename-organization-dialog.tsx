'use client';
import { getGetOrganizationKey, getListOrganizationsKey, useUpdateOrganization } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '../components/x-spinner';
import { GearIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/app/components/generic-error';

export function RenameOrganizationDialog({
  organizationId,
  currentName,
}: {
  organizationId: string;
  currentName: string;
}) {
  const { trigger, isMutating, error, reset } = useUpdateOrganization(organizationId, {
    swr: {
      onSuccess: () => Promise.all([mutate(getGetOrganizationKey(organizationId)), mutate(getListOrganizationsKey())]),
    },
  });
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(op) => {
        setOpen(op);
        if (!op) {
          reset();
        }
      }}
    >
      <Dialog.Trigger>
        <Button>
          <GearIcon />
          Rename
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
              try {
                await trigger({
                  name,
                });
                setOpen(false);
              } catch (_handled_by_swr) {}
            }}
          >
            <Dialog.Title>Rename Organization</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Change the organization name.
            </Dialog.Description>

            {error && <GenericErrorCallout title={'Failed to rename organization'} error={error} />}

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
