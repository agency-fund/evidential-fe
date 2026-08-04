import { packScreen, WizardForm } from '@/services/wizard/wizard-types';
import { SelectDatasourceScreen } from './select-datasource-screen';
import { SelectTableScreen } from './select-table-screen';
import { type ExperimentType } from '@/services/experiment-utils';

export type DatasourceFormInputData = {
  datasourceId?: string;
  tableName?: string;
  primaryKey?: string;
  clusterKey?: string;
  experimentType?: ExperimentType;
};
// Form data for the datasource selection/creation wizard
export type DatasourceFormData = {
  // Selected datasource ID
  datasourceId?: string;
  // Selected table name
  tableName?: string;
  // Selected primary key field
  primaryKey?: string;
  // Optional cluster key field for cluster-randomized experiments
  clusterKey?: string;
  // Experiment type context from the parent wizard (read-only)
  experimentType?: ExperimentType;
  // Selection mode: existing or create
  selectionMode: 'existing' | 'create';
};

// Screen identifiers for the datasource wizard
export type DatasourceScreenId = 'select-datasource' | 'select-table';

// Helper to create screens with proper type inference
const screen = packScreen<DatasourceFormData, DatasourceScreenId>();

export const DatasourceForm: WizardForm<DatasourceFormData, DatasourceScreenId, DatasourceFormInputData> = {
  initialData: (inputData) => ({
    datasourceId: inputData?.datasourceId,
    tableName: inputData?.tableName,
    primaryKey: inputData?.primaryKey,
    clusterKey: inputData?.clusterKey,
    experimentType: inputData?.experimentType,
    selectionMode: 'existing',
  }),
  initialScreenId: () => 'select-datasource',
  breadcrumbs: () => ['select-datasource', 'select-table'],
  screens: {
    'select-datasource': screen({
      breadcrumbTitle: 'Datasource',
      render: SelectDatasourceScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-datasource') {
          return {
            ...data,
            datasourceId: msg.value,
            tableName: undefined,
            primaryKey: undefined,
            clusterKey: undefined,
          };
        }
        if (msg.type === 'set-mode') {
          if (msg.value === 'create') {
            return { ...data, selectionMode: msg.value, datasourceId: undefined };
          }
          return { ...data, selectionMode: msg.value };
        }
        if (msg.type === 'datasource-created') {
          return {
            ...data,
            datasourceId: msg.datasourceId,
            selectionMode: 'existing',
            tableName: undefined,
            primaryKey: undefined,
            clusterKey: undefined,
          };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.datasourceId,
      prevScreen: () => ({ type: 'wizard-exit-left' }),
      nextScreen: () => ({ type: 'screen', id: 'select-table' }),
    }),
    'select-table': screen({
      breadcrumbTitle: 'Table',
      render: SelectTableScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-table') {
          return {
            ...data,
            tableName: msg.value,
            primaryKey: undefined,
            clusterKey: undefined,
          };
        }
        if (msg.type === 'set-primary-key') {
          return {
            ...data,
            primaryKey: msg.value,
            clusterKey: data.clusterKey === msg.value ? undefined : data.clusterKey, // Can't be the same as the primary key
          };
        }
        if (msg.type === 'set-cluster-key') {
          return { ...data, clusterKey: msg.value };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.tableName && !!data.primaryKey,
      prevScreen: () => ({ type: 'screen', id: 'select-datasource' }),
      nextScreen: () => ({ type: 'submit' }),
      isBreadcrumbClickable: (data) => !!data.datasourceId,
      nextButtonLabel: () => 'Next', // override "submit" text
    }),
  },
};
