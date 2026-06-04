'use client';
import { useCreateUser } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { XSpinner } from '@/components/ui/x-spinner';
import { PlusIcon } from '@radix-ui/react-icons';
import { invalidatePath } from '@/services/swr-cache';
import { GenericErrorCallout } from '@/components/ui/generic-error';

interface FormFields {
  email: string;
}

const defaultFormData = (): FormFields => ({
  email: '',
});

export function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData());

  const { trigger, isMutating, error, reset } = useCreateUser({
    swr: {
      onSuccess: async () => {
        await invalidatePath('/v1/m/users');
        handleClose();
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
    await trigger({ email: formData.email });
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
          <PlusIcon /> Add User
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Adding user..." />
        ) : (
          <form onSubmit={handleSubmit}>
            <Dialog.Title>Add User</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Creates a user record by email. The user will be able to log in via Google and will land on a welcome
              screen if they are not yet a member of any organization. No email is sent; you must inform them
              out-of-band.
            </Dialog.Description>

            {error && <GenericErrorCallout title="Failed to add user" error={error} />}

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Email
                </Text>
                <TextField.Root
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
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
              <Button type="submit">Add</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
