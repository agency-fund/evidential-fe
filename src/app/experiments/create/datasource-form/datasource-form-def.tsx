import { packScreen, WizardForm } from '@/services/wizard/wizard-types';
import { SelectDatasourceScreen } from './select-datasource-screen';
import { SelectTableScreen } from './select-table-screen';

// Delegate to the existing datasource form reducer
import {
  DatasourceFormData as CreateDatasourceFormData,
  defaultDatasourceFormData,
} from '@/components/features/datasources/add-datasource-form';
import { DataType } from '@/api/methods.schemas';
import { type ExperimentType, isMabExperimentType } from '@/services/experiment-utils';

export type DatasourceFormInputData = {
  datasourceId?: string;
  tableName?: string;
  primaryKey?: string;
  clusterKey?: string;
  targetFieldName?: string;
  targetFieldType?: DataType;
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
  // Target column for DWH-backed MAB experiments (the column read as each participant's outcome).
  targetFieldName?: string;
  // The target column's data type, used downstream to lock the binary/real outcome choice.
  targetFieldType?: DataType;
  // Experiment type context from the parent wizard (read-only)
  experimentType?: ExperimentType;
  // Selection mode: existing or create
  selectionMode: 'existing' | 'create';
  // Create datasource form state (reuse existing interface)
  createForm: CreateDatasourceFormData;
};

// Screen identifiers for the datasource wizard
export type DatasourceScreenId = 'select-datasource' | 'select-table';

// Helper to create screens with proper type inference
const screen = packScreen<DatasourceFormData, DatasourceScreenId>();

export const DatasourceForm: WizardForm<DatasourceFormData, DatasourceScreenId, DatasourceFormInputData> = {
  initialData: (inputData) => ({
    createForm: defaultDatasourceFormData(),
    datasourceId: inputData?.datasourceId,
    tableName: inputData?.tableName,
    primaryKey: inputData?.primaryKey,
    clusterKey: inputData?.clusterKey,
    targetFieldName: inputData?.targetFieldName,
    targetFieldType: inputData?.targetFieldType,
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
            targetFieldName: undefined,
            targetFieldType: undefined,
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
            targetFieldName: undefined,
            targetFieldType: undefined,
            createForm: defaultDatasourceFormData(),
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
            targetFieldName: undefined,
            targetFieldType: undefined,
          };
        }
        if (msg.type === 'set-primary-key') {
          // The target can't be the same column as the primary key; drop it (and its type) if it was.
          const targetCollidesWithPk = data.targetFieldName === msg.value;
          return {
            ...data,
            primaryKey: msg.value,
            clusterKey: data.clusterKey === msg.value ? undefined : data.clusterKey, // Can't be the same as the primary key
            targetFieldName: targetCollidesWithPk ? undefined : data.targetFieldName,
            targetFieldType: targetCollidesWithPk ? undefined : data.targetFieldType,
          };
        }
        if (msg.type === 'set-cluster-key') {
          return { ...data, clusterKey: msg.value };
        }
        if (msg.type === 'set-target-field') {
          return { ...data, targetFieldName: msg.value, targetFieldType: msg.dataType };
        }
        return data;
      },
      // MAB-DWH requires a target column; for all other flows the target picker is not shown and is irrelevant.
      isNextEnabled: (data) =>
        !!data.tableName && !!data.primaryKey && (!isMabExperimentType(data.experimentType) || !!data.targetFieldName),
      prevScreen: () => ({ type: 'screen', id: 'select-datasource' }),
      nextScreen: () => ({ type: 'submit' }),
      isBreadcrumbClickable: (data) => !!data.datasourceId,
      nextButtonLabel: () => 'Next', // override "submit" text
    }),
  },
};
