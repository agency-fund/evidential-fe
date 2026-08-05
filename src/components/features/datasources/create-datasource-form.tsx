'use client';
import { getListOrganizationDatasourcesKey, useCreateDatasource } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { Button, Flex } from '@radix-ui/themes';
import { mutate } from 'swr';
import { ApiError } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import {
  AddDatasourceFormFields,
  buildDsn,
  datasourceFormReducer,
  defaultDatasourceFormData,
} from '@/components/features/datasources/add-datasource-form-fields';
import { useReducer } from 'react';

interface CreateDatasourceFormProps {
  onDatasourceCreated: (datasourceId: string) => void;
}

export const CreateDatasourceForm = ({ onDatasourceCreated }: CreateDatasourceFormProps) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;
  const [formData, dispatch] = useReducer(datasourceFormReducer, defaultDatasourceFormData());

  const { trigger, error, isMutating } = useCreateDatasource(
    { connectivity_check: true },
    {
      swr: {
        onSuccess: async (response) => {
          onDatasourceCreated(response.id);
          await mutate(getListOrganizationDatasourcesKey(organizationId));
        },
      },
    },
  );

  const isDNSError = error instanceof ApiError && error.response.status === 400;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await trigger(
      {
        organization_id: organizationId,
        name: formData.name,
        dsn: buildDsn(formData),
      },
      {
        throwOnError: false,
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="2">
        <AddDatasourceFormFields data={formData} dispatch={dispatch} isDNSError={isDNSError} />
      </Flex>
      {error && !isDNSError && <GenericErrorCallout title="Failed to add datasource" error={error} />}
      <Flex gap="3" mt="4" justify="end">
        <Button type="submit" loading={isMutating}>
          Add Datasource
        </Button>
      </Flex>
    </form>
  );
};
