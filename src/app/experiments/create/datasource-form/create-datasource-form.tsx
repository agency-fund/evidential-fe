'use client';
import { getListOrganizationDatasourcesKey, useCreateDatasource } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { Button, Flex } from '@radix-ui/themes';
import { BqDsnInput, PostgresDsn, RedshiftDsn } from '@/api/methods.schemas';
import { mutate } from 'swr';
import { PostgresSslModes } from '@/services/typehelper';
import { ApiError } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import {
  AddDatasourceForm,
  datasourceFormReducer,
  defaultDatasourceFormData,
} from '@/components/features/datasources/add-datasource-form';
import { useReducer } from 'react';

interface CreateDatasourceFormProps {
  onDatasourceCreated: (datasourceId: string) => void;
}

export const CreateDatasourceForm = ({ onDatasourceCreated }: CreateDatasourceFormProps) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;
  const [formData, dispatch] = useReducer(datasourceFormReducer, defaultDatasourceFormData());

  const { trigger, error, isMutating } = useCreateDatasource({
    swr: {
      onSuccess: async (response) => {
        onDatasourceCreated(response.id);
        await mutate(getListOrganizationDatasourcesKey(organizationId));
      },
    },
  });

  const isDNSError = error instanceof ApiError && error.response.status === 400;

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
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="2">
        <AddDatasourceForm data={formData} dispatch={dispatch} isDNSError={isDNSError} />
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
