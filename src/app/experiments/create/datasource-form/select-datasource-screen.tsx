'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { DatasourceFormData } from './datasource-form-def';
import { useListOrganizationDatasources } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { XSpinner } from '@/components/ui/x-spinner';
import { Button, Flex, Select, Text } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { PlusIcon } from '@radix-ui/react-icons';
import { useEffect } from 'react';

type SelectDatasourceMessages = { type: 'set-datasource'; value: string } | { type: 'switch-to-create' };

export const SelectDatasourceScreen = ({
  data,
  dispatch,
}: ScreenProps<DatasourceFormData, SelectDatasourceMessages>) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;

  const { data: datasourcesData, isLoading: datasourcesIsLoading } = useListOrganizationDatasources(organizationId, {
    swr: {
      enabled: !!organizationId,
    },
  });

  const datasources = datasourcesData?.items;
  // Filter out 'none' driver datasources (API-only)
  const availableDatasources = datasources?.filter((ds) => ds.driver !== 'none') ?? [];
  const isEmpty = availableDatasources.length === 0;

  // Auto-navigate to create screen if no datasources exist
  useEffect(() => {
    if (!datasourcesIsLoading && isEmpty) {
      dispatch({ type: 'switch-to-create' });
    }
  }, [datasourcesIsLoading, isEmpty, dispatch]);

  if (datasourcesIsLoading) {
    return <XSpinner />;
  }

  // If we're about to switch to create mode, show spinner
  if (isEmpty) {
    return <XSpinner />;
  }

  return (
    <Flex direction="column" gap={'3'}>
      <WizardBreadcrumbs />
      <Text size="2" weight="bold">
        Select a datasource
      </Text>
      <Select.Root
        value={data.datasourceId}
        onValueChange={(datasourceId) => {
          dispatch({ type: 'set-datasource', value: datasourceId });
        }}
      >
        <Select.Trigger placeholder="Select a datasource" />
        <Select.Content>
          {availableDatasources.map((ds) => (
            <Select.Item key={ds.id} value={ds.id}>
              {ds.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
      <Button
        variant="soft"
        onClick={() => {
          dispatch({ type: 'switch-to-create' });
        }}
      >
        <PlusIcon /> Add New Datasource
      </Button>
    </Flex>
  );
};
