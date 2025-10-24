'use client';
import { getGetOrganizationKey, useAddMemberToOrganization } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { PlusIcon } from '@radix-ui/react-icons';
import { mutate } from 'swr';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface FormFields {
  email: string;
}

const defaultFormData = (): FormFields => ({
  email: '',
});

export function AddUserDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData());

  const { trigger, isMutating, error, reset } = useAddMemberToOrganization(organizationId, {
    swr: {
      onSuccess: () => {
        handleClose();
        mutate(getGetOrganizationKey(organizationId));
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
    await trigger({
      email: formData.email,
    });
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
          <PlusIcon />
          Add User
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Adding user..." />
        ) : (
          <form onSubmit={handleSubmit}>
            <Dialog.Title>Add Member</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Add a member to this organization.
            </Dialog.Description>

            {error && <GenericErrorCallout title="Failed to add member" error={error} />}

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Email
                </Text>
                <TextField.Root
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  type="email"
                  placeholder="Enter member email"
                  required
                  autoComplete={'off'}
                />
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
