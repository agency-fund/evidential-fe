import { packScreen, WizardForm } from '@/services/wizard/wizard-types';
import { SelectDatasourceScreen } from './select-datasource-screen';
import { CreateNewDatasourceScreen } from './create-new-datasource-screen';
import { SelectTableScreen } from './select-table-screen';

// Delegate to the existing datasource form reducer
import {
  DatasourceFormData as CreateDatasourceFormData,
  datasourceFormReducer,
  defaultDatasourceFormData,
} from '@/components/features/datasources/add-datasource-form';

export type DatasourceFormInputData = {
  datasourceId?: string;
  tableName?: string;
};
// Form data for the datasource selection/creation wizard
export type DatasourceFormData = {
  // Selected datasource ID
  datasourceId?: string;
  // Selected table name
  tableName?: string;

  // Mode toggle: true when creating a new datasource
  isCreatingNew: boolean;

  // Create datasource form state (reuse existing interface)
  createForm: CreateDatasourceFormData;
};

// Screen identifiers for the datasource wizard
export type DatasourceScreenId = 'select-datasource' | 'create-new-datasource' | 'select-table';

// Helper to create screens with proper type inference
const screen = packScreen<DatasourceFormData, DatasourceScreenId>();

export const DatasourceForm: WizardForm<DatasourceFormData, DatasourceScreenId, DatasourceFormInputData> = {
  initialData: (inputData) => ({
    isCreatingNew: false,
    createForm: defaultDatasourceFormData(),
    datasourceId: inputData?.datasourceId,
    tableName: inputData?.tableName,
  }),
  initialScreenId: () => 'select-datasource',
  breadcrumbs: () => ['select-datasource', 'select-table'],
  screens: {
    'select-datasource': screen({
      breadcrumbTitle: 'Datasource',
      render: SelectDatasourceScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-datasource') {
          return { ...data, datasourceId: msg.value, tableName: undefined };
        }
        if (msg.type === 'switch-to-create') {
          return { ...data, isCreatingNew: true, datasourceId: undefined };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.datasourceId || data.isCreatingNew,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'wizard-prop-onprev' }),
      nextScreen: (data) => {
        if (data.isCreatingNew) {
          return { type: 'screen', id: 'create-new-datasource' };
        }
        return { type: 'screen', id: 'select-table' };
      },
      isBreadcrumbClickable: () => true,
    }),
    'create-new-datasource': screen({
      breadcrumbTitle: 'Create Datasource',
      render: CreateNewDatasourceScreen,
      reducer: (data, msg) => {
        if (msg.type === 'datasource-created') {
          return {
            ...data,
            datasourceId: msg.datasourceId,
            isCreatingNew: false,
            createForm: defaultDatasourceFormData(),
          };
        }
        if (msg.type === 'cancel-create') {
          return {
            ...data,
            isCreatingNew: false,
            createForm: defaultDatasourceFormData(),
          };
        }
        if (msg.type === 'form-message') {
          return {
            ...data,
            createForm: datasourceFormReducer(data.createForm, msg.message),
          };
        }
        return data;
      },
      // Next is disabled - submission happens via form button, then auto-advances
      isNextEnabled: () => false,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'select-datasource' }),
      nextScreen: () => ({ type: 'screen', id: 'select-table' }),
      isBreadcrumbClickable: () => false,
    }),
    'select-table': screen({
      breadcrumbTitle: 'Table',
      render: SelectTableScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-table') {
          return { ...data, tableName: msg.value };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.tableName,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'select-datasource' }),
      nextScreen: () => ({ type: 'submit' }),
      isBreadcrumbClickable: (data) => !!data.datasourceId,
      nextButtonLabel: () => 'Next',
    }),
  },
};
