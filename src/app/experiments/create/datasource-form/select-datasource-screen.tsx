'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { DatasourceFormData } from './datasource-form-def';
import { Flex, RadioGroup, Text } from '@radix-ui/themes';
import { WizardBreadcrumbs } from '@/services/wizard/wizard-breadcrumbs-context';
import { useListOrganizationDatasources } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { XSpinner } from '@/components/ui/x-spinner';
import { CreateDatasourceForm } from './create-datasource-form';
import { DatasourceCardsGrid } from '@/app/experiments/create/datasource-form/datasource-cards-grid';

type SelectDatasourceMessages =
  | { type: 'set-datasource'; value: string }
  | { type: 'set-mode'; value: 'existing' | 'create' }
  | { type: 'datasource-created'; datasourceId: string };

export const SelectDatasourceScreen = ({
  data,
  dispatch,
  navigateNext,
}: ScreenProps<DatasourceFormData, SelectDatasourceMessages>) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;

  const { data: datasourcesData, isLoading } = useListOrganizationDatasources(organizationId, {
    swr: { enabled: !!organizationId },
  });

  const availableDatasources = datasourcesData?.items?.filter((ds) => ds.driver !== 'none') ?? [];
  const hasDatasources = availableDatasources.length > 0;

  if (isLoading) {
    return <XSpinner />;
  }

  // Case 1: No datasources - show only the creation form
  if (!hasDatasources) {
    return (
      <Flex direction="column" gap="3">
        <WizardBreadcrumbs />
        <CreateDatasourceForm
          onDatasourceCreated={(id) => {
            dispatch({ type: 'datasource-created', datasourceId: id });
            navigateNext();
          }}
        />
      </Flex>
    );
  }

  // Case 2: Has datasources - show RadioCards toggle
  return (
    <Flex direction="column" gap="3">
      <WizardBreadcrumbs />
      <Flex direction={'column'} gap={'3'}>
        <RadioGroup.Root
          value={data.selectionMode}
          onValueChange={(value) => dispatch({ type: 'set-mode', value: value as 'existing' | 'create' })}
        >
          <RadioGroup.Item value="existing">
            <Text weight="bold">Use an existing datasource</Text>
            {data.selectionMode === 'existing' && (
              <DatasourceCardsGrid
                datasources={availableDatasources}
                selectedDatasourceId={data.datasourceId}
                onSelect={(id) => dispatch({ type: 'set-datasource', value: id })}
              />
            )}
          </RadioGroup.Item>

          <RadioGroup.Item value="create">
            <Text weight="bold">Create a new datasource</Text>
            {data.selectionMode === 'create' && (
              <CreateDatasourceForm
                onDatasourceCreated={(id) => {
                  dispatch({ type: 'datasource-created', datasourceId: id });
                  navigateNext();
                }}
              />
            )}
          </RadioGroup.Item>
        </RadioGroup.Root>
      </Flex>
    </Flex>
  );
};
