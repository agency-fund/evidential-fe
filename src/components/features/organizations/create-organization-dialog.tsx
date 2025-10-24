'use client';
import { getListOrganizationsKey, useCreateOrganizations } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { PlusIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface FormFields {
  name: string;
}

const defaultFormData = (): FormFields => ({
  name: '',
});

export function CreateOrganizationDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData());

  const { trigger, isMutating, error, reset } = useCreateOrganizations({
    swr: {
      onSuccess: () => {
        handleClose();
        mutate(getListOrganizationsKey());
      },
    },
  });

  const handleClose = () => {
    setFormData(defaultFormData());
    reset();
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await trigger({ name: formData.name });
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
          <form onSubmit={handleSubmit}>
            <Dialog.Title>Create Organization</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Create a new organization.
            </Dialog.Description>

            {error && <GenericErrorCallout title="Failed to create organization" error={error} />}

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
              <Button type="submit">Create</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
