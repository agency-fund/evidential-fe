import { getInspectDatasourceKey, useUpdateDatasource } from '@/api/admin';
import { useState } from 'react';
import { Button, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { mutate } from 'swr';
import { XSpinner } from '@/app/components/x-spinner';

export const UpdateDatasourceDialog = ({
  datasourceId,
  currentName,
}: {
  datasourceId: string;
  currentName: string;
}) => {
  const { trigger, isMutating } = useUpdateDatasource(datasourceId);
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Flex gap="3">
          <Button>Rename Datasource</Button>
        </Flex>
      </Dialog.Trigger>

      <Dialog.Content>
        {isMutating ? (
          <XSpinner message="Creating participant type..." />
        ) : (
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              const name = fd.get('name') as string;
              await trigger({
                name,
              });
              await mutate(getInspectDatasourceKey(datasourceId, {}));
              setOpen(false);
            }}
          >
            <Dialog.Title>Update Datasource</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Update datasource settings.
            </Dialog.Description>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Name
                </Text>
                <TextField.Root name="name" defaultValue={currentName} required />
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit">Update</Button>
            </Flex>
          </form>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};
