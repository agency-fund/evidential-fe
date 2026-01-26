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
import { ExperimentsSummarizeBayesScreen } from '@/app/experiments/create/experiment-form/experiment-summarize-bayes-screen';
import {
  ExperimentFreqStackScreen,
  ExperimentFreqStackScreenMessage,
} from '@/app/experiments/create/experiment-form/experiment-freq-stack-screen';
import { ExperimentsSummarizeFreqScreen } from '@/app/experiments/create/experiment-form/experiment-summarize-freq-screen';
import { BanditArm, Context, MetricWithMDE, Stratum } from '@/app/datasources/[datasourceId]/experiments/create/types';
import {
  getReasonableEndDate,
  getReasonableStartDate,
} from '@/app/experiments/create/experiment-form/experiment-form-helpers';
import { ErrorType } from '@/services/orval-fetch';

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

  // experiment-select-binary-or-real-outcomes
  outcomeType?: 'binary' | 'real';

  // experiment-describe-arms-screen
  arms?: Omit<Arm, 'arm_id'>[];

  // experiment-describe-bandit-arms-screen
  bandit_arms?: BanditArm[];

  // experiment-describe-contexts-screen
  priorType?: 'beta' | 'normal';
  contexts?: Context[];

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
  | 'bayes-binary-or-real'
  | 'describe-contexts'
  | 'describe-arms'
  | 'describe-bandit-arms'
  | 'freq-stack'
  | 'summarize-freq'
  | 'summarize-bayes';

// Helper to create screens with proper type inference
const screen = packScreen<ExperimentFormData, ExperimentScreenId>();

const FREQUENTIST_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'freq-select-datasource',
  'describe-arms',
  'freq-stack',
  'summarize-freq',
] as const;

const CMAB_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'bayes-binary-or-real',
  'describe-contexts',
  'describe-bandit-arms',
  'summarize-bayes',
] as const;

const MAB_BREADCRUMBS: Array<ExperimentScreenId> = [
  'metadata',
  'experiment-type',
  'bayes-binary-or-real',
  'describe-bandit-arms',
  'summarize-bayes',
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
    bandit_arms: [
      {
        arm_name: 'Control',
        arm_description: 'Control',
        alpha_prior: 1,
        beta_prior: 1,
        mean_prior: 0,
        stddev_prior: 1,
      },
      {
        arm_name: 'Treatment',
        arm_description: 'Treatment',
        alpha_prior: 2,
        beta_prior: 1,
        mean_prior: 1,
        stddev_prior: 1,
      },
    ],
    contexts: [{ name: 'Context', description: '', type: 'real-valued' }],
    outcomeType: 'binary',
    confidence: '95',
    power: '80',
  }),
  initialScreenId: () => 'metadata',
  breadcrumbs: breadcrumbs,
  screens: {
    metadata: screen({
      breadcrumbTitle: 'Experiment Description',
      render: ExperimentMetadataScreen,
      breadcrumbs: breadcrumbs,
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
      isPrevEnabled: () => false,
      prevScreen: () => null,
      nextScreen: () => ({ type: 'screen', id: 'experiment-type' }),
      isBreadcrumbClickable: () => true,
    }),
    'experiment-type': screen({
      breadcrumbTitle: 'Type',
      render: ExperimentTypeScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-experiment-type') {
          return { ...data, experimentType: msg.value, createExperimentResponse: undefined };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.experimentType,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'metadata' }),
      nextScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'freq_online':
          case 'freq_preassigned':
            return { type: 'screen', id: 'freq-select-datasource' };
          case 'mab_online':
          case 'cmab_online':
            return { type: 'screen', id: 'bayes-binary-or-real' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      breadcrumbs: breadcrumbs,
      isBreadcrumbClickable: () => true,
    }),
    'freq-select-datasource': screen({
      breadcrumbTitle: 'Datasource',
      render: ExperimentSelectDatasourceScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-datasource') {
          return {
            ...data,
            datasourceId: msg.datasourceId,
            tableName: msg.tableName,

            // Changing datasource should clear power check
            powerCheckResponse: undefined,
          };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.datasourceId && !!data.tableName,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'experiment-type' }),
      nextScreen: () => ({ type: 'screen', id: 'describe-arms' }),
      isBreadcrumbClickable: () => true,
      hideNavigation: () => true,
    }),
    'bayes-binary-or-real': screen({
      breadcrumbTitle: 'Outcomes',
      breadcrumbs: breadcrumbs,
      render: ExperimentSelectBinaryOrRealOutcomes,
      reducer: (data, msg) => {
        if (msg.type === 'set-outcome-type') {
          return { ...data, outcomeType: msg.value };
        }
        return data;
      },
      isNextEnabled: () => true,
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'experiment-type' }),
      nextScreen: ({ experimentType }) => {
        if (experimentType === 'cmab_online') {
          return { type: 'screen', id: 'describe-contexts' };
        }
        return { type: 'screen', id: 'describe-bandit-arms' };
      },
      isBreadcrumbClickable: () => true,
    }),
    'describe-contexts': screen({
      breadcrumbTitle: 'Contexts',
      render: ExperimentDescribeContextsScreen,
      reducer: (data, msg) => {
        const contexts = data.contexts ?? [];
        if (msg.type === 'add-context') {
          return { ...data, contexts: [...contexts, { name: '', description: '', type: 'binary' }] };
        }
        if (msg.type === 'remove-context') {
          return { ...data, contexts: contexts.filter((_, i) => i !== msg.index) };
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
          return { ...data, contexts: newContexts };
        }
        return data;
      },
      isNextEnabled: (data) => {
        const contexts = data.contexts ?? [];
        return contexts.length >= 1 && contexts.every((c) => c.name.trim() !== '');
      },
      isPrevEnabled: () => true,
      prevScreen: () => ({ type: 'screen', id: 'bayes-binary-or-real' }),
      nextScreen: () => ({ type: 'screen', id: 'describe-bandit-arms' }),
      isBreadcrumbClickable: ({ outcomeType }) => !!outcomeType,
      nextButtonTooltip: (data) => {
        const contexts = data.contexts ?? [];
        if (contexts.length < 1) return 'At least one context is required.';
        const emptyNameIndex = contexts.findIndex((c) => c.name.trim() === '');
        if (emptyNameIndex >= 0) return `Context ${emptyNameIndex + 1} name is required.`;
        return '';
      },
    }),
    'describe-bandit-arms': screen({
      breadcrumbTitle: 'Arms',
      render: ExperimentDescribeBanditArmsScreen,
      reducer: (data, msg) => {
        const arms = data.bandit_arms ?? [];
        if (msg.type === 'add-arm') {
          const priorType = data.experimentType === 'mab_online' && data.outcomeType === 'binary' ? 'beta' : 'normal';
          const newArm =
            priorType === 'beta'
              ? { arm_name: '', arm_description: '', alpha_prior: 1, beta_prior: 1 }
              : { arm_name: '', arm_description: '', mean_prior: 0, stddev_prior: 1 };
          return { ...data, bandit_arms: [...arms, newArm] };
        }
        if (msg.type === 'remove-arm') {
          return { ...data, bandit_arms: arms.filter((_, i) => i !== msg.index) };
        }
        if (msg.type === 'update-arm') {
          const newArms = [...arms];
          newArms[msg.index] = { ...newArms[msg.index], [msg.field]: msg.value };
          return { ...data, bandit_arms: newArms };
        }
        if (msg.type === 'set-create-response') {
          return {
            ...data,
            createExperimentResponse: msg.response,
            createExperimentError: undefined,
            experimentId: msg.response.experiment_id,
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
      isNextEnabled: () => true, // The screen handles its own validation
      isPrevEnabled: () => true,
      hideNavigation: () => true,
      prevScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'mab_online':
            return { type: 'screen', id: 'bayes-binary-or-real' };
          case 'cmab_online':
            return { type: 'screen', id: 'describe-contexts' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      nextScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'mab_online':
          case 'cmab_online':
            return { type: 'screen', id: 'summarize-bayes' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      isBreadcrumbClickable: ({ outcomeType }) => !!outcomeType,
      breadcrumbs: breadcrumbs,
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
      isPrevEnabled: () => true,
      prevScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'freq_online':
          case 'freq_preassigned':
            return { type: 'screen', id: 'freq-select-datasource' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      nextScreen: ({ experimentType }) => {
        switch (experimentType) {
          case 'freq_online':
          case 'freq_preassigned':
            return { type: 'screen', id: 'freq-stack' };
          default:
            throw new Error(`Experiment type ${experimentType} unhandled`);
        }
      },
      isBreadcrumbClickable: () => true,
      breadcrumbs: breadcrumbs,
    }),
    'freq-stack': screen({
      breadcrumbTitle: 'Parameters',
      render: ExperimentFreqStackScreen,
      reducer: (data, msg: ExperimentFreqStackScreenMessage) => {
        // Primary key
        if (msg.type === 'set-primary-key') {
          return { ...data, primaryKey: msg.value };
        }

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
          return { ...data, createExperimentResponse: msg.response, createExperimentError: undefined };
        }

        return data;
      },
      isNextEnabled: () => true, // ignored
      isPrevEnabled: () => true,
      hideNavigation: () => true,
      prevScreen: () => ({ type: 'screen', id: 'describe-arms' }),
      nextScreen: () => ({ type: 'screen', id: 'summarize-freq' }),
      isBreadcrumbClickable: (data) => !!(data.datasourceId && data.tableName),
    }),
    'summarize-freq': screen({
      breadcrumbTitle: 'Summary',
      render: ExperimentsSummarizeFreqScreen,
      isBreadcrumbClickable: () => false,
      reducer: (data, msg) => {
        if (msg.type === 'set-commit-error') {
          return { ...data, commitError: msg.response };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.createExperimentResponse,
      isPrevEnabled: (data) => !data.createExperimentResponse,
      prevScreen: () => ({ type: 'screen', id: 'freq-stack' }),
      nextScreen: () => ({ type: 'submit' }),
      hideNavigation: () => true,
    }),
    'summarize-bayes': screen({
      breadcrumbTitle: 'Summary',
      render: ExperimentsSummarizeBayesScreen,
      reducer: (data, msg) => {
        if (msg.type === 'set-commit-error') {
          return { ...data, commitError: msg.response };
        }
        return data;
      },
      isNextEnabled: (data) => !!data.createExperimentResponse,
      isPrevEnabled: (data) => !data.createExperimentResponse,
      prevScreen: () => ({ type: 'screen', id: 'describe-bandit-arms' }),
      nextScreen: () => ({ type: 'submit' }),
      hideNavigation: () => true,
      isBreadcrumbClickable: () => false,
      breadcrumbs: breadcrumbs,
    }),
  },
};
