'use client';
import { getGetOrganizationKey, getListOrganizationsKey, useUpdateOrganization } from '@/api/admin';
import { useEffect, useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { GearIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface FormFields {
  name: string;
}

const defaultFormData = (currentName: string): FormFields => ({
  name: currentName,
});

export function RenameOrganizationDialog({
  organizationId,
  currentName,
}: {
  organizationId: string;
  currentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData(currentName));

  const { trigger, isMutating, error, reset } = useUpdateOrganization(organizationId, {
    swr: {
      onSuccess: async () => {
        handleClose();
        await Promise.all([mutate(getGetOrganizationKey(organizationId)), mutate(getListOrganizationsKey())]);
      },
    },
  });

  useEffect(() => {
    if (open && currentName) {
      setFormData(defaultFormData(currentName));
    }
  }, [open, currentName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await trigger({
      name: formData.name,
    });
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(op) => {
        if (!op) {
          handleClose();
        } else {
          setOpen(op);
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
          <form onSubmit={handleSubmit}>
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
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter organization name"
                  required
                />
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
