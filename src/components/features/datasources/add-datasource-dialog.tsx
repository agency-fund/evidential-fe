'use client';
import { getGetOrganizationKey, getListOrganizationDatasourcesKey, useCreateDatasource } from '@/api/admin';
import { useReducer, useState } from 'react';
import { Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { PlusIcon } from '@radix-ui/react-icons';
import { BqDsnInput, PostgresDsn, RedshiftDsn } from '@/api/methods.schemas';
import { mutate } from 'swr';
import { PostgresSslModes } from '@/services/typehelper';
import { ApiError } from '@/services/orval-fetch';
import {
  AddDatasourceForm,
  datasourceFormReducer,
  defaultDatasourceFormData,
} from '@/components/features/datasources/add-datasource-form';

export function AddDatasourceDialog({ organizationId }: { organizationId: string }) {
  const [open, setOpen] = useState(false);
  const [formData, dispatch] = useReducer(datasourceFormReducer, undefined, defaultDatasourceFormData);
  const { trigger, reset, error } = useCreateDatasource({
    swr: {
      onSuccess: async () => {
        handleClose();
        await Promise.all([
          mutate(getListOrganizationDatasourcesKey(organizationId)),
          mutate(getGetOrganizationKey(organizationId)),
        ]);
      },
    },
  });

  const isDNSError = error instanceof ApiError && error.response.status === 400;

  const handleClose = () => {
    dispatch({ type: 'reset' });
    reset();
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let dsn: PostgresDsn | RedshiftDsn | BqDsnInput;
    if (formData.dwhType === 'postgres') {
      dsn = {
        type: 'postgres',
        host: formData.host,
        port: parseInt(formData.port),
        dbname: formData.database,
        user: formData.user,
        password: { type: 'revealed', value: formData.password },
        sslmode: formData.sslmode as PostgresSslModes,
        search_path: formData.search_path || null,
      };
    } else if (formData.dwhType === 'redshift') {
      dsn = {
        type: 'redshift',
        host: formData.host,
        port: parseInt(formData.port),
        dbname: formData.database,
        user: formData.user,
        password: { type: 'revealed', value: formData.password },
        search_path: formData.search_path || null,
      };
    } else {
      dsn = {
        type: 'bigquery',
        project_id: formData.project_id,
        dataset_id: formData.dataset,
        credentials: {
          type: 'serviceaccountinfo',
          content: formData.credentials_json,
        },
      };
    }

    await trigger(
      {
        organization_id: organizationId,
        name: formData.name,
        dsn,
      },
      {
        throwOnError: false,
      },
    );
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
          <PlusIcon /> Add Datasource
        </Button>
      </Dialog.Trigger>

      <Dialog.Content>
        <form onSubmit={handleSubmit}>
          <Dialog.Title>Add Datasource</Dialog.Title>
          <Dialog.Description size="2" mb="4">
            <Text>Add a datasource to this organization.</Text>
          </Dialog.Description>

          {error && !isDNSError && <GenericErrorCallout title="Failed to add datasource" error={error} />}

          <Flex direction="column" gap="3">
            <AddDatasourceForm data={formData} dispatch={dispatch} isDNSError={isDNSError} />
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray">
                Cancel
              </Button>
            </Dialog.Close>
            <Button type="submit">Add Datasource</Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
