'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { DatasourceFormData, DatasourceScreenId } from './datasource-form-def';
import { Card, Flex } from '@radix-ui/themes';
import { useListOrganizationDatasources } from '@/api/admin';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { XSpinner } from '@/components/ui/x-spinner';
import { CreateDatasourceForm } from '@/components/features/datasources/create-datasource-form';
import { DatasourceCardsGrid } from '@/app/experiments/create/datasource-form/datasource-cards-grid';
import { DatasourceModeSelector } from '@/app/experiments/create/datasource-form/datasource-mode-selector';
import { DatasourceSummary } from '@/api/methods.schemas';
import { isUsableDatasource } from '@/services/genapi-helpers';

type SelectDatasourceMessages =
  | { type: 'set-datasource'; value: string }
  | { type: 'set-mode'; value: 'existing' | 'create' }
  | { type: 'datasource-created'; datasourceId: string };

const find_first_remote_datasource = (datasources: DatasourceSummary[]) => datasources.find(isUsableDatasource);

export const SelectDatasourceScreen = ({
  data,
  dispatch,
  navigateNext,
}: ScreenProps<DatasourceFormData, SelectDatasourceMessages, DatasourceScreenId>) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;

  const { data: datasourcesData, isLoading } = useListOrganizationDatasources(organizationId, {
    swr: {
      enabled: !!organizationId,
      onSuccess: (response) => {
        if (!data.datasourceId && response.items.length > 0) {
          // Find the first remote DWH.
          const remoteId = find_first_remote_datasource(response.items)?.id;
          if (remoteId) {
            dispatch({ type: 'set-datasource', value: remoteId });
          }
        }
      },
    },
  });

  const availableDatasources = datasourcesData?.items?.filter(isUsableDatasource) ?? [];
  const hasDatasources = availableDatasources.length > 0;

  if (isLoading) {
    return <XSpinner />;
  }

  // Case 1: No datasources - show only the creation form
  if (!hasDatasources) {
    return (
      <Flex direction="column" gap="3">
        <CreateDatasourceForm
          onDatasourceCreated={(id) => {
            dispatch({ type: 'datasource-created', datasourceId: id });
            navigateNext();
          }}
        />
      </Flex>
    );
  }

  // Case 2: Has datasources - show mode toggle with the active option's content below
  return (
    <DatasourceModeSelector
      mode={data.selectionMode}
      onModeChange={(mode) => dispatch({ type: 'set-mode', value: mode as 'existing' | 'create' })}
      hasDatasources={hasDatasources}
      existingContent={
        <DatasourceCardsGrid
          datasources={availableDatasources}
          selectedDatasourceId={data.datasourceId}
          onSelect={(id) => dispatch({ type: 'set-datasource', value: id })}
        />
      }
      createContent={
        <Card>
          <CreateDatasourceForm
            onDatasourceCreated={(id) => {
              dispatch({ type: 'datasource-created', datasourceId: id });
              navigateNext();
            }}
          />
        </Card>
      }
    />
  );
};
