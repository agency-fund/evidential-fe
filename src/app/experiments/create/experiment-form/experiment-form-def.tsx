// Form data types
import { packScreen, WizardForm } from '@/services/wizard/wizard-types';
import {
  ExperimentMetadataMessages,
  ExperimentMetadataScreen,
} from '@/app/experiments/create/experiment-form/experiment-metadata-screen';
import { ExperimentTypeScreen } from '@/app/experiments/create/experiment-form/experiment-type-screen';
import {
  Arm,
  BayesABExperimentSpecInputExperimentType,
  ContextType,
  CreateExperimentResponse,
  DesignSpecInput,
  FilterInput,
  GetFiltersResponseElement,
  PowerResponseOutput,
} from '@/api/methods.schemas';
import { ExperimentSelectDatasourceScreen } from '@/app/experiments/create/experiment-form/experiment-select-datasource-screen';
import { ExperimentSelectBinaryOrRealOutcomes } from '@/app/experiments/create/experiment-form/experiment-select-binary-or-real-outcomes';
import {
  ExperimentDescribeArmsMessage,
  ExperimentDescribeArmsScreen,
} from '@/app/experiments/create/experiment-form/experiment-describe-arms-screen';
import { ExperimentDescribeContextsScreen } from '@/app/experiments/create/experiment-form/experiment-describe-contexts-screen';
import { ExperimentDescribeBanditArmsScreen } from '@/app/experiments/create/experiment-form/experiment-describe-bandit-arms-screen';
import { ExperimentsSummarizeBanditScreen } from '@/app/experiments/create/experiment-form/experiment-summarize-bandit-screen';
import {
  ExperimentFreqStackScreen,
  ExperimentFreqStackScreenMessage,
} from '@/app/experiments/create/experiment-form/experiment-freq-stack-screen';
import { ExperimentsSummarizeFreqScreen } from '@/app/experiments/create/experiment-form/experiment-summarize-freq-screen';
import {
  getReasonableEndDate,
  getReasonableStartDate,
} from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import {
  createDefaultBanditParams,
  toBanditParamsForExperimentType,
  toCmabBanditParams,
  toMabBanditParams,
} from '@/app/experiments/create/experiment-form/experiment-bandit-helpers';
import { ErrorType } from '@/services/orval-fetch';
import {
  BanditParams,
  isBanditExperimentType,
  MetricWithMDE,
  Stratum,
} from '@/app/experiments/create/experiment-form/experiment-form-types';

export type ExperimentType = Exclude<DesignSpecInput['experiment_type'], BayesABExperimentSpecInputExperimentType>;

// Defines the entirety of the editable data collected via this wizard flow.
export type ExperimentFormData = {
  // experiment-metadata-screen
  name?: string;
  hypothesis?: string;
  designUrl?: string;
  startDate?: string;
  endDate?: string;

  // experiment-type-screen
  experimentType?: ExperimentType;

  // experiment-select-datasource-screen
  datasourceId?: string;
  tableName?: string;

  // experiment-freq-stack-screen
  primaryKey?: string;
  primaryMetric?: MetricWithMDE;
  secondaryMetrics?: MetricWithMDE[];
  filters?: FilterInput[];
  // Cache of available filter fields (and their data types) for lookup/display/search
  availableFilterFields?: GetFiltersResponseElement[];
  strata?: Stratum[];
  // These next 2 Experiment Parameters are strings to allow for empty values,
  // which should be converted to numbers when making power or experiment creation requests.
  confidence?: string;
  power?: string;
  // Populated when user clicks "Power Check" on DesignForm
  chosenN?: number;
  powerCheckResponse?: PowerResponseOutput;
  createExperimentResponse?: CreateExperimentResponse;
  createExperimentError?: ErrorType<unknown>;

  // experiment-describe-webhooks-screen
  selectedWebhookIds?: string[];

  // experiment-describe-arms-screen
  arms?: Omit<Arm, 'arm_id'>[];

  // bandit flow config
  bandit?: BanditParams;

  // experiment-summarize-freq-screen (populated after createExperiment API call)
  experimentId?: string;
  commitError?: ErrorType<unknown>;
};

const isFreq = (experimentType: ExperimentType) => {
  return experimentType === 'freq_online' || experimentType === 'freq_preassigned';
};

const isCmab = (experimentType: ExperimentType) => {
  return experimentType === 'cmab_online';
};

// Defines a type for all known screen IDs for the experiment form. This type is used with screen() to
// type-check the ids returned by nextScreen and prevScreen.
export type ExperimentScreenId =
  | 'metadata'
  | 'experiment-type'
  | 'freq-select-datasource'
  | 'bandit-binary-or-real'
  | 'describe-contexts'
  | 'describe-arms'
  | 'describe-bandit-arms'
  | 'freq-stack'
  | 'summarize-freq'
  | 'summarize-bandit';

// Helper to create screens with proper type inference
const screen = packScreen<ExperimentFormData, ExperimentScreenId>();

const FREQUENTIST_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'describe-arms',
  'freq-select-datasource',
  'freq-stack',
  'summarize-freq',
] as const;

const CMAB_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'describe-contexts',
  'bandit-binary-or-real',
  'describe-bandit-arms',
  'summarize-bandit',
] as const;

const MAB_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'bandit-binary-or-real',
  'describe-bandit-arms',
  'summarize-bandit',
] as const;

const breadcrumbs = ({ experimentType }: { experimentType?: ExperimentType }) => {
  if (experimentType === undefined) {
    return [];
  } else if (isFreq(experimentType)) {
    return FREQUENTIST_BREADCRUMBS;
  } else if (isCmab(experimentType)) {
    return CMAB_BREADCRUMBS;
  } else {
    return MAB_BREADCRUMBS;
  }
};

export const ExperimentForm: WizardForm<ExperimentFormData, ExperimentScreenId, undefined> = {
  initialData: () => ({
    name: 'New Hypothesis',
    experimentType: 'freq_online',
    startDate: getReasonableStartDate(),
    endDate: getReasonableEndDate(),
    arms: [
      { arm_name: 'Control', arm_description: 'Control' },
      { arm_name: 'Treatment', arm_description: 'Treatment' },
    ],
    bandit: createDefaultBanditParams('mab_online'),
    confidence: '95',
    power: '80',
  }),
  initialScreenId: () => 'metadata',
  breadcrumbs: breadcrumbs,
  screens: {
    metadata: screen({
      breadcrumbTitle: 'Experiment Description',
      render: ExperimentMetadataScreen,
      reducer: (data, msg: ExperimentMetadataMessages) => {
        if (msg.type === 'set-name') return { ...data, name: msg.value };
        if (msg.type === 'set-hypothesis') return { ...data, hypothesis: msg.value };
        if (msg.type === 'set-design-url') return { ...data, designUrl: msg.value || undefined };
        if (msg.type === 'set-start-date') return { ...data, startDate: msg.value };
        if (msg.type === 'set-end-date') return { ...data, endDate: msg.value };
        if (msg.type === 'set-webhook-ids') return { ...data, selectedWebhookIds: msg.value };
        return data;
      },
      isNextEnabled: (data) => {
        if (!data.name) return false;
        if (!data.startDate || !data.endDate) return false;
        if (data.endDate <= data.startDate) return false;
        return true;
      },
    }),
    'experiment-type': screen({
      breadcrumbTitle: 'Type',
      render: ExperimentTypeScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-experiment-type') {
          const experimentType = msg.value;
          const nextData = {
            ...data,
            experimentType,
            datasourceId:
              isBanditExperimentType(data.experimentType) != isBanditExperimentType(experimentType)
                ? undefined
                : data.datasourceId,
            createExperimentResponse: undefined,
            createExperimentError: undefined,
            commitError: undefined,
          };

          if (!isBanditExperimentType(experimentType)) {
            return {
              ...nextData,
              bandit: undefined,
            };
          }

          return {
            ...nextData,
            bandit: toBanditParamsForExperimentType(experimentType, data.bandit),
          };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.experimentType,
    }),
    'freq-select-datasource': screen({
      breadcrumbTitle: 'Datasource',
      render: ExperimentSelectDatasourceScreen,
      reducer: (data, msg) => {
        const shouldClearDependents = data.datasourceId !== msg.datasourceId || data.tableName !== msg.tableName;
        if (msg.type === 'set-datasource') {
          return {
            ...data,
            datasourceId: msg.datasourceId,
            tableName: msg.tableName,
            primaryKey: msg.primaryKey,

            // Clear metrics and filters if the datasource ID or table have changed. This could be improved by retain
            // entries based on the inspection results.
            primaryMetric: shouldClearDependents ? undefined : data.primaryMetric,
            secondaryMetrics: shouldClearDependents ? undefined : data.secondaryMetrics,
            filters: shouldClearDependents ? undefined : data.filters,
            strata: shouldClearDependents ? undefined : data.strata,

            // Changing datasource should clear power check
            powerCheckResponse: undefined,
            chosenN: undefined,
          };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.datasourceId && !!data.tableName,

      hideNavigation: () => true, // hide navigation because this screen uses a nested wizard.
    }),
    'bandit-binary-or-real': screen({
      breadcrumbTitle: 'Outcomes',

      render: ExperimentSelectBinaryOrRealOutcomes,
      reducer: (data, msg) => {
        if (msg.type === 'set-outcome-type') {
          if (data.bandit === undefined) {
            return data;
          }
          return {
            ...data,
            bandit:
              data.bandit.experimentType === 'mab_online'
                ? toMabBanditParams(msg.value, data.bandit.arms)
                : toCmabBanditParams(msg.value, data.bandit.arms, data.bandit.contexts),
          };
        }
        return data;
      },
    }),
    'describe-contexts': screen({
      breadcrumbTitle: 'Contexts',
      render: ExperimentDescribeContextsScreen,
      reducer: (data, msg) => {
        if (data.bandit?.experimentType !== 'cmab_online') {
          return data;
        }
        const contexts = data.bandit.contexts;
        if (msg.type === 'add-context') {
          return {
            ...data,
            bandit: { ...data.bandit, contexts: [...contexts, { name: '', description: '', type: 'real-valued' }] },
          };
        }
        if (msg.type === 'remove-context') {
          return {
            ...data,
            bandit: { ...data.bandit, contexts: contexts.filter((_, i) => i !== msg.index) },
          };
        }
        if (msg.type === 'update-context') {
          const newContexts = [...contexts];
          const ctx = newContexts[msg.index];
          switch (msg.field) {
            case 'name':
              newContexts[msg.index] = { ...ctx, name: msg.value };
              break;
            case 'description':
              newContexts[msg.index] = { ...ctx, description: msg.value };
              break;
            case 'type':
              newContexts[msg.index] = { ...ctx, type: msg.value as ContextType };
              break;
          }
          return { ...data, bandit: { ...data.bandit, contexts: newContexts } };
        }
        return data;
      },
      isNextEnabled: (data) => {
        const contexts = data.bandit?.experimentType === 'cmab_online' ? data.bandit.contexts : [];
        return contexts.length >= 1 && contexts.every((c) => c.name.trim() !== '');
      },
      isBreadcrumbClickable: ({ bandit }) => bandit !== undefined,
      nextButtonTooltip: (data) => {
        const contexts = data.bandit?.experimentType === 'cmab_online' ? data.bandit.contexts : [];
        if (contexts.length < 1) return 'At least one context is required.';
        const emptyNameIndex = contexts.findIndex((c) => c.name.trim() === '');
        if (emptyNameIndex >= 0) return `Context ${emptyNameIndex + 1} name is required.`;
        return undefined;
      },
    }),
    'describe-bandit-arms': screen({
      breadcrumbTitle: 'Arms',
      render: ExperimentDescribeBanditArmsScreen,
      reducer: (data, msg) => {
        if (data.bandit === undefined) {
          return data;
        }
        const arms = data.bandit.arms;
        if (msg.type === 'add-arm') {
          const priorType = data.bandit.priorType;
          const newArm =
            priorType === 'beta'
              ? { arm_name: '', arm_description: '', alpha_prior: 1, beta_prior: 1 }
              : { arm_name: '', arm_description: '', mean_prior: 0, stddev_prior: 1 };
          return { ...data, bandit: { ...data.bandit, arms: [...arms, newArm] } };
        }
        if (msg.type === 'remove-arm') {
          return { ...data, bandit: { ...data.bandit, arms: arms.filter((_, i) => i !== msg.index) } };
        }
        if (msg.type === 'update-arm') {
          const newArms = [...arms];
          newArms[msg.index] = { ...newArms[msg.index], [msg.field]: msg.value };
          return { ...data, bandit: { ...data.bandit, arms: newArms } };
        }
        if (msg.type === 'set-create-response') {
          return {
            ...data,
            createExperimentResponse: msg.response,
            createExperimentError: undefined,
            experimentId: msg.response.experiment_id,
            commitError: undefined,
          };
        }
        if (msg.type === 'set-create-error') {
          return { ...data, createExperimentError: msg.response, createExperimentResponse: undefined };
        }
        if (msg.type === 'set-datasource-id') {
          return { ...data, datasourceId: msg.datasourceId };
        }
        return data;
      },

      hideNavigation: () => true, // screen handles next to handle CreateExperiment API call
      isBreadcrumbClickable: ({ bandit }) => bandit !== undefined,
    }),
    'describe-arms': screen({
      breadcrumbTitle: 'Arms',
      render: ExperimentDescribeArmsScreen,
      reducer: (data, msg: ExperimentDescribeArmsMessage) => {
        const arms = data.arms ?? [];

        if (msg.type === 'add-arm') {
          const newArm =
            arms.length === 0
              ? { arm_name: 'Control', arm_description: 'Arm 1 will be used as baseline for comparison.' }
              : { arm_name: '', arm_description: '' };
          // Reset weights when adding
          const newArms = [...arms, newArm].map((a) => ({ ...a, arm_weight: undefined }));
          return { ...data, arms: newArms };
        }

        if (msg.type === 'remove-arm') {
          // Reset weights when removing
          const newArms = arms.filter((_, i) => i !== msg.index).map((a) => ({ ...a, arm_weight: undefined }));
          return { ...data, arms: newArms };
        }

        if (msg.type === 'update-arm') {
          const newArms = [...arms];
          newArms[msg.index] = { ...newArms[msg.index], [msg.field]: msg.value };
          return { ...data, arms: newArms };
        }

        if (msg.type === 'set-weights') {
          const newArms = arms.map((arm, i) => ({ ...arm, arm_weight: msg.weights[i] }));
          return { ...data, arms: newArms };
        }

        return data;
      },
      isNextEnabled: (data) => (data.arms?.length ?? 0) >= 2,
    }),
    'freq-stack': screen({
      breadcrumbTitle: 'Parameters',
      render: ExperimentFreqStackScreen,
      reducer: (data, msg: ExperimentFreqStackScreenMessage) => {
        // Metric builder actions - all metric changes invalidate power check
        if (msg.type === 'primary-metric-select') {
          return { ...data, primaryMetric: msg.primaryMetric, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'primary-metric-deselect') {
          return {
            ...data,
            primaryMetric: msg.primaryMetric,
            secondaryMetrics: msg.secondaryMetrics,
            powerCheckResponse: undefined,
            chosenN: undefined,
          };
        }
        if (msg.type === 'promote-secondary-to-primary') {
          return {
            ...data,
            primaryMetric: msg.primaryMetric,
            secondaryMetrics: msg.secondaryMetrics,
            powerCheckResponse: undefined,
            chosenN: undefined,
          };
        }
        if (msg.type === 'secondary-metric-add') {
          return { ...data, secondaryMetrics: msg.secondaryMetrics, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'secondary-metric-remove') {
          return { ...data, secondaryMetrics: msg.secondaryMetrics, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'mde-change') {
          return {
            ...data,
            primaryMetric: msg.primaryMetric ?? data.primaryMetric,
            secondaryMetrics: msg.secondaryMetrics ?? data.secondaryMetrics,
            powerCheckResponse: undefined,
            chosenN: undefined,
          };
        }

        // Filter builder - filter changes invalidate power check
        if (msg.type === 'set-filters') {
          return { ...data, filters: msg.filters, powerCheckResponse: undefined, chosenN: undefined };
        }

        // Strata builder
        if (msg.type === 'set-strata') {
          return { ...data, strata: msg.strata.map((fieldName) => ({ fieldName })) };
        }

        // Power check - changing confidence/power invalidates power check response
        if (msg.type === 'set-confidence') {
          return { ...data, confidence: msg.value, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'set-power') {
          return { ...data, power: msg.value, powerCheckResponse: undefined, chosenN: undefined };
        }
        if (msg.type === 'set-power-check-response') {
          return { ...data, powerCheckResponse: msg.response, chosenN: msg.chosenN };
        }
        if (msg.type === 'set-chosen-n') {
          return { ...data, chosenN: msg.value };
        }
        if (msg.type === 'set-create-error') {
          return { ...data, createExperimentError: msg.response, createExperimentResponse: undefined };
        }
        if (msg.type === 'set-create-response') {
          return {
            ...data,
            createExperimentResponse: msg.response,
            createExperimentError: undefined,
            commitError: undefined,
          };
        }

        return data;
      },

      hideNavigation: () => true, // screen handles next to handle CreateExperiment API call
      isBreadcrumbClickable: (data) => !!(data.datasourceId && data.tableName),
    }),
    'summarize-freq': screen({
      breadcrumbTitle: 'Summary',
      render: ExperimentsSummarizeFreqScreen,
      isBreadcrumbClickable: () => false, // user must enter screen via "next" from previous screen
      reducer: (data, msg) => {
        if (msg.type === 'set-commit-error') {
          return { ...data, commitError: msg.response };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.createExperimentResponse,
      isPrevEnabled: (data) => !data.createExperimentResponse,
      hideNavigation: () => true, // screen handles prev to allow "back" to handle abandonment
    }),
    'summarize-bandit': screen({
      breadcrumbTitle: 'Summary',
      render: ExperimentsSummarizeBanditScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-commit-error') {
          return { ...data, commitError: msg.response };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.createExperimentResponse,
      isPrevEnabled: (data) => !data.createExperimentResponse,
      hideNavigation: () => true, // screen handles prev to allow "back" to handle abandonment
      isBreadcrumbClickable: () => false, // user must enter screen via "next" from previous screen
    }),
  },
};
