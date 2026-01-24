'use client';
import { useReducer, useState } from 'react';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData } from '@/app/experiments/create/experiment-form-def';
import { getListOrganizationDatasourcesKey, useCreateDatasource, useListOrganizationDatasources } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { XSpinner } from '@/components/ui/x-spinner';
import { Button, Card, Flex, Heading, Select } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { PlusIcon } from '@radix-ui/react-icons';
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

type ExperimentSelectDatasourceMessages =
  | { type: 'set-datasource'; value: string }
  | { type: 'set-creating-datasource'; value: boolean };

export const ExperimentSelectDatasourceScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentSelectDatasourceMessages>) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [dsFormData, dsDispatch] = useReducer(datasourceFormReducer, undefined, defaultDatasourceFormData);

  const { data: datasourcesData, isLoading: datasourcesIsLoading } = useListOrganizationDatasources(organizationId, {
    swr: {
      enabled: !!organizationId,
    },
  });

  const { trigger, reset, error, isMutating } = useCreateDatasource({
    swr: {
      onSuccess: async (response) => {
        dispatch({ type: 'set-datasource', value: response.id });
        await mutate(getListOrganizationDatasourcesKey(organizationId));
        dsDispatch({ type: 'reset' });
        setShowCreateForm(false);
      },
    },
  });

  const datasources = datasourcesData?.items;
  const isEmpty = datasources?.length === 0 || (datasources?.length === 1 && datasources[0].driver === 'none');

  const isDNSError = error instanceof ApiError && error.response.status === 400;

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

  if (datasourcesIsLoading) {
    return <XSpinner />;
  }

  // Show create form if no datasources exist, or if user explicitly clicked "Add New"
  if (isEmpty || showCreateForm) {
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
              <AddDatasourceForm data={dsFormData} dispatch={dsDispatch} isDNSError={isDNSError} />
            </Flex>
            <Flex gap="3" mt="4" justify="end">
              {!isEmpty && (
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  onClick={() => {
                    setShowCreateForm(false);
                    dispatch({ type: 'set-creating-datasource', value: false });
                    reset();
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isMutating}>
                Add Datasource
              </Button>
            </Flex>
          </form>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex direction="column" gap="3">
      <WizardBreadcrumbs />
      <Select.Root
        value={data.datasourceId}
        onValueChange={(datasourceId) => {
          dispatch({ type: 'set-datasource', value: datasourceId });
        }}
      >
        <Select.Trigger placeholder="Select a datasource" />
        <Select.Content>
          {datasources
            ?.filter((v) => v.driver != 'none')
            .map((ds) => (
              <Select.Item key={ds.id} value={ds.id}>
                {ds.name}
              </Select.Item>
            ))}
        </Select.Content>
      </Select.Root>
      <Button
        variant="soft"
        onClick={() => {
          setShowCreateForm(true);
          dispatch({ type: 'set-creating-datasource', value: true });
        }}
      >
        <PlusIcon /> Add New Datasource
      </Button>
    </Flex>
  );
};
