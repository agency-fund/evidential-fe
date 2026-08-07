'use client';
import { ScreenProps } from '@/services/wizard/wizard-types';
import { ExperimentFormData, ExperimentScreenId } from '@/app/experiments/create/experiment-form/experiment-form-types';
import { DataType } from '@/api/methods.schemas';
import { Card, Flex } from '@radix-ui/themes';
import { useCurrentOrganization } from '@/providers/organization-provider';
import { useListOrganizationDatasources } from '@/api/admin';
import { XSpinner } from '@/components/ui/x-spinner';
import { DatasourceCardsGrid } from '../datasource-form/datasource-cards-grid';
import { CreateDatasourceForm } from '@/components/features/datasources/create-datasource-form';
import { DatasourceMode } from '../datasource-form/datasource-mode';
import { DatasourceModeSelector } from '../datasource-form/datasource-mode-selector';
import { SelectTableFields } from './select-table-fields';
import { isUsableDatasource } from '@/services/genapi-helpers';

export type ExperimentMabSelectDatasourceMessages =
  | { type: 'set-dwh-mode'; value: DatasourceMode }
  | { type: 'set-datasource'; datasourceId: string }
  | { type: 'set-table'; tableName: string }
  | { type: 'set-primary-key'; primaryKey?: string }
  | { type: 'set-target-field'; targetFieldName?: string; targetFieldType?: DataType };

/**
 * Optional MAB step for binding the bandit to a data-warehouse target column. A single radio picks how
 * outcomes are recorded — no warehouse (API-only), an existing datasource, or a new one — and the
 * shared table / primary key / target-column picker appears below the options once a datasource is chosen.
 */
export const ExperimentMabSelectDatasourceScreen = ({
  data,
  dispatch,
}: ScreenProps<ExperimentFormData, ExperimentMabSelectDatasourceMessages, ExperimentScreenId>) => {
  const orgContext = useCurrentOrganization();
  const organizationId = orgContext!.current.id;

  const { data: datasourcesData, isLoading: loadingDatasources } = useListOrganizationDatasources(organizationId, {
    swr: { enabled: !!organizationId },
  });
  const availableDatasources = datasourcesData?.items?.filter(isUsableDatasource) ?? [];

  if (loadingDatasources) {
    return <XSpinner message="Loading datasources..." />;
  }

  const hasDatasources = availableDatasources.length > 0;
  // Default to connecting a warehouse; fall back to create when there are none yet.
  const mode: DatasourceMode = data.dwhMode ?? (hasDatasources ? 'existing' : 'create');

  // The table/target picker, shown inside whichever datasource option is active once one is chosen.
  const datasourceId = data.datasourceId;
  const picker = datasourceId ? (
    <SelectTableFields
      key={datasourceId}
      datasourceId={datasourceId}
      tableName={data.tableName}
      primaryKey={data.primaryKey}
      targetFieldName={data.targetFieldName}
      showTargetField
      onTableChange={(tableName) => dispatch({ type: 'set-table', tableName })}
      onPrimaryKeyChange={(primaryKey) => dispatch({ type: 'set-primary-key', primaryKey })}
      onTargetFieldChange={(targetFieldName, targetFieldType) =>
        dispatch({ type: 'set-target-field', targetFieldName, targetFieldType })
      }
    />
  ) : null;

  return (
    <Flex direction="column" gap="3">
      <Card>
        <DatasourceModeSelector
          mode={mode}
          onModeChange={(value) => dispatch({ type: 'set-dwh-mode', value })}
          hasDatasources={hasDatasources}
          showNoDwhOption
          existingContent={
            <Flex direction="column" gap="3">
              <DatasourceCardsGrid
                datasources={availableDatasources}
                selectedDatasourceId={data.datasourceId}
                onSelect={(id) => dispatch({ type: 'set-datasource', datasourceId: id })}
              />
              {picker}
            </Flex>
          }
          createContent={
            data.datasourceId ? (
              picker
            ) : (
              <Card>
                <CreateDatasourceForm
                  onDatasourceCreated={(id) => dispatch({ type: 'set-datasource', datasourceId: id })}
                />
              </Card>
            )
          }
        />
      </Card>
    </Flex>
  );
};
