'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { DatasourceFormData } from './datasource-form-def';
import { getListOrganizationDatasourcesKey, useCreateDatasource } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { Button, Card, Flex, Heading } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { BqDsnInput, PostgresDsn, RedshiftDsn } from '@/api/methods.schemas';
import { mutate } from 'swr';
import { PostgresSslModes } from '@/services/typehelper';
import { ApiError } from '@/services/orval-fetch';
import { GenericErrorCallout } from '@/components/ui/generic-error';
import { AddDatasourceForm, DatasourceFormMessage } from '@/components/features/datasources/add-datasource-form';

type CreateDatasourceMessages =
  | { type: 'form-message'; message: DatasourceFormMessage }
  | { type: 'datasource-created'; datasourceId: string }
  | { type: 'cancel-create' };

export const CreateNewDatasourceScreen = ({
  data,
  dispatch,
}: ScreenProps<DatasourceFormData, CreateDatasourceMessages>) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;

  const { trigger, reset, error, isMutating } = useCreateDatasource({
    swr: {
      onSuccess: async (response) => {
        dispatch({ type: 'datasource-created', datasourceId: response.id });
        await mutate(getListOrganizationDatasourcesKey(organizationId));
      },
    },
  });

  const dsFormData = data.createForm;
  const isDNSError = error instanceof ApiError && error.response.status === 400;

  const handleFormDispatch = (msg: DatasourceFormMessage) => {
    dispatch({ type: 'form-message', message: msg });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    let dsn: PostgresDsn | RedshiftDsn | BqDsnInput;
    if (dsFormData.dwhType === 'postgres') {
      dsn = {
        type: 'postgres',
        host: dsFormData.host,
        port: parseInt(dsFormData.port),
        dbname: dsFormData.database,
        user: dsFormData.user,
        password: { type: 'revealed', value: dsFormData.password },
        sslmode: dsFormData.sslmode as PostgresSslModes,
        search_path: dsFormData.search_path || null,
      };
    } else if (dsFormData.dwhType === 'redshift') {
      dsn = {
        type: 'redshift',
        host: dsFormData.host,
        port: parseInt(dsFormData.port),
        dbname: dsFormData.database,
        user: dsFormData.user,
        password: { type: 'revealed', value: dsFormData.password },
        search_path: dsFormData.search_path || null,
      };
    } else {
      dsn = {
        type: 'bigquery',
        project_id: dsFormData.project_id,
        dataset_id: dsFormData.dataset,
        credentials: {
          type: 'serviceaccountinfo',
          content: dsFormData.credentials_json,
        },
      };
    }

    await trigger(
      {
        organization_id: organizationId,
        name: dsFormData.name,
        dsn,
      },
      {
        throwOnError: false,
      },
    );
  };

  const handleCancel = () => {
    reset();
    dispatch({ type: 'cancel-create' });
  };

  return (
    <Flex direction="column" gap="3">
      <WizardBreadcrumbs />
      <Card>
        <form onSubmit={handleSubmit}>
          <Heading size="4" mb="4">
            Add Datasource
          </Heading>
          {error && !isDNSError && <GenericErrorCallout title="Failed to add datasource" error={error} />}
          <Flex direction="column" gap="3">
            <AddDatasourceForm data={dsFormData} dispatch={handleFormDispatch} isDNSError={isDNSError} />
          </Flex>
          <Flex gap="3" mt="4" justify="end">
            <Button type="button" variant="soft" color="gray" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isMutating}>
              Add Datasource
            </Button>
          </Flex>
        </form>
      </Card>
    </Flex>
  );
};
