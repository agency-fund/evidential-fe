'use client';
import { Button, Dialog, Flex, Heading, Spinner, Table, Text, TextField } from '@radix-ui/themes';
import { useCreateOrganizations, useListOrganizations } from '@/api/admin';
import { PlusIcon } from '@radix-ui/react-icons';
import { OrganizationSummary } from '@/api/methods.schemas';
import { useState } from 'react';
import Link from 'next/link';
import { AddUserDialog } from '@/app/organizationdetails/AddUserDialog';
import { AddDatasourceDialog } from '@/app/organizationdetails/AddDatasourceDialog';

const CreateOrganizationDialog = () => {
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
          <Spinner />
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
};

function OrganizationsTable({ organizations }: { organizations: OrganizationSummary[] }) {
  return (
    <Table.Root variant="surface">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Organization ID</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {organizations.map((item) => (
          <Table.Row key={item.id}>
            <Table.Cell>
              <Link href={`/organizationdetails?id=${item.id}`}>{item.name}</Link>
            </Table.Cell>
            <Table.Cell>{item.id}</Table.Cell>
            <Table.Cell>
              <Flex gap="2">
                <AddUserDialog organizationId={item.id} />
                <AddDatasourceDialog organizationId={item.id} />
              </Flex>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

export default function Page() {
  const { data, isLoading, error } = useListOrganizations();

  if (isLoading || data === undefined) {
    return <Spinner />;
  }
  if (error) {
    return <Text>Error: {JSON.stringify(error)}</Text>;
  }
  return (
    <Flex direction="column" gap="3">
      <Heading>Manage Organizations</Heading>
      <Flex justify="between" align="center">
        <Heading size="4">Organizations</Heading>
        <CreateOrganizationDialog />
      </Flex>
      <OrganizationsTable organizations={data.data.items} />
    </Flex>
  );
}
