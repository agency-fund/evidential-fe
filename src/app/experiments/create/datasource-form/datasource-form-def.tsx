import { packScreen, WizardForm } from '@/services/wizard/wizard-types';
import { SelectDatasourceScreen } from './select-datasource-screen';
import { SelectTableScreen } from './select-table-screen';

// Delegate to the existing datasource form reducer
import {
  DatasourceFormData as CreateDatasourceFormData,
  defaultDatasourceFormData,
} from '@/components/features/datasources/add-datasource-form';

export type DatasourceFormInputData = {
  datasourceId?: string;
  tableName?: string;
  primaryKey?: string;
};
// Form data for the datasource selection/creation wizard
export type DatasourceFormData = {
  // Selected datasource ID
  datasourceId?: string;
  // Selected table name
  tableName?: string;
  // Selected primary key field
  primaryKey?: string;
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
          return { ...data, datasourceId: msg.value, tableName: undefined, primaryKey: undefined };
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
          return { ...data, tableName: msg.value, primaryKey: undefined };
        }
        if (msg.type === 'set-primary-key') {
          return { ...data, primaryKey: msg.value };
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
